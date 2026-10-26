const express = require("express")
const db = require("../config/db")
const crypto = require("crypto")
const { requireModerator, requireAdmin, configuredAdminIds } = require("../middleware/moderation")
const router = express.Router()
router.use(requireModerator)
router.get("/access", async (req,res) => {
  try {
    const [[counts]] = await db.execute("SELECT (SELECT COUNT(*) FROM users) AS members_count,(SELECT COUNT(*) FROM moderation_sanctions WHERE action='warning' AND revoked_at IS NULL) AS active_warnings,(SELECT COUNT(*) FROM moderation_sanctions WHERE action IN ('temp_ban','permanent_ban') AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>NOW())) AS active_bans")
    res.json({ role: req.moderationRole, permissions: { reviewUsers: true, issueWarnings: true, temporaryBans: true, permanentBans: true, manageRoles: req.moderationRole === "admin", auditLog: req.moderationRole === "admin" }, stats: counts })
  } catch(e) {
    console.error("[Moderation] access",e)
    res.status(500).json({message:"Unable to load moderation access"})
  }
})
const validId = value => /^\d+$/.test(String(value || "")) && Number(value) > 0
const reasonText = value => typeof value === "string" ? value.trim().slice(0, 500) : ""
async function audit(actor, target, action, reason, metadata) {
  await db.execute("INSERT INTO moderation_audit (actor_user_id,target_user_id,action,reason,metadata_json,created_at) VALUES (?,?,?,?,?,NOW())", [actor,target,action,reason,metadata ? JSON.stringify(metadata) : null])
}
router.get("/users", async (req,res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0,80) : ""
    const like = "%" + search.replace(/[\\%_]/g, "\\$&") + "%"
    const [rows] = await db.execute("SELECT u.id,u.username,u.email,u.avatar_url,u.xp,u.created_at,COALESCE(mr.role,'user') AS stored_role,(SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id) AS posts_count,(SELECT COUNT(*) FROM comments c WHERE c.user_id=u.id) AS comments_count,(SELECT COUNT(*) FROM task_completions tc WHERE tc.user_id=u.id) AS completions_count,(SELECT COUNT(*) FROM moderation_sanctions s WHERE s.target_user_id=u.id AND s.action='warning' AND s.revoked_at IS NULL) AS warning_count,EXISTS(SELECT 1 FROM moderation_sanctions b WHERE b.target_user_id=u.id AND b.action IN ('temp_ban','permanent_ban') AND b.revoked_at IS NULL AND (b.expires_at IS NULL OR b.expires_at>NOW())) AS is_banned FROM users u LEFT JOIN moderation_roles mr ON mr.user_id=u.id WHERE (?='' OR u.username LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR)=?) ORDER BY u.created_at DESC LIMIT 100", [search,like,like,search])
    const admins = configuredAdminIds()
    res.json(rows.map(u => ({...u,role:admins.has(String(u.id)) ? "admin" : u.stored_role,email:req.moderationRole==="admin" ? u.email : undefined,is_banned:Boolean(u.is_banned),warning_count:Number(u.warning_count)})))
  } catch(e) { console.error("[Moderation] list",e); res.status(500).json({message:"Unable to load users"}) }
})
router.get("/users/:id", async (req,res) => {
  if (!validId(req.params.id)) return res.status(400).json({message:"Invalid user id"})
  try {
    const id = Number(req.params.id)
    const [[user]] = await db.execute("SELECT id,username,email,bio,avatar_url,xp,created_at FROM users WHERE id=?", [id])
    if (!user) return res.status(404).json({message:"User not found"})
    const [[activity]] = await db.execute("SELECT (SELECT COUNT(*) FROM posts WHERE user_id=?) AS posts_count,(SELECT COUNT(*) FROM comments WHERE user_id=?) AS comments_count,(SELECT COUNT(*) FROM task_completions WHERE user_id=?) AS completions_count,(SELECT COUNT(*) FROM tasks WHERE user_id=?) AS tasks_count", [id,id,id,id])
    const [posts] = await db.execute("SELECT id,content,type,is_anonymous,created_at,likes_count FROM posts WHERE user_id=? ORDER BY created_at DESC LIMIT 100", [id])
    const [comments] = await db.execute("SELECT id,post_id,content,is_anonymous,created_at FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 100", [id])
    const [sanctions] = await db.execute("SELECT id,action,reason,expires_at,revoked_at,created_at FROM moderation_sanctions WHERE target_user_id=? ORDER BY created_at DESC LIMIT 50", [id])
    const [roles] = await db.execute("SELECT role FROM moderation_roles WHERE user_id=? LIMIT 1", [id])
    res.json({user:{...user,role:configuredAdminIds().has(String(id)) ? "admin" : (roles[0]?.role || "user")},activity,posts,comments,sanctions})
  } catch(e) { console.error("[Moderation] detail",e); res.status(500).json({message:"Unable to load user details"}) }
})
router.post("/users/:id/warnings", async (req,res) => {
  if (!validId(req.params.id)) return res.status(400).json({message:"Invalid user id"})
  const id=Number(req.params.id), reason=reasonText(req.body?.reason)
  if (reason.length<3) return res.status(400).json({message:"A reason is required"})
  if (id===Number(req.userId)) return res.status(400).json({message:"Cannot warn yourself"})
  try {
    const [roles]=await db.execute("SELECT role FROM moderation_roles WHERE user_id=? LIMIT 1",[id])
    if (configuredAdminIds().has(String(id)) || roles[0]?.role==="admin" || (req.moderationRole==="moderator" && roles[0]?.role==="moderator")) return res.status(403).json({message:"Cannot sanction this account"})
    const [[target]]=await db.execute("SELECT id FROM users WHERE id=?",[id])
    if (!target) return res.status(404).json({message:"User not found"})
    const [[count]]=await db.execute("SELECT COUNT(*) AS total FROM moderation_sanctions WHERE target_user_id=? AND action='warning' AND revoked_at IS NULL",[id])
    if (Number(count.total)>=3) return res.status(409).json({message:"Three warnings already recorded"})
    await db.execute("INSERT INTO moderation_sanctions (target_user_id,actor_user_id,action,reason,created_at) VALUES (?,?,'warning',?,NOW())",[id,req.userId,reason])
    await audit(req.userId,id,"warning",reason)
    res.status(201).json({message:"Warning recorded",warningCount:Number(count.total)+1})
  } catch(e) { console.error("[Moderation] warning",e); res.status(500).json({message:"Unable to issue warning"}) }
})
router.post("/users/:id/ban", async (req,res) => {
  if (!validId(req.params.id)) return res.status(400).json({message:"Invalid user id"})
  const id=Number(req.params.id), reason=reasonText(req.body?.reason), permanent=req.body?.permanent===true
  if (reason.length<3) return res.status(400).json({message:"A reason is required"})
  let expires=null
  if (!permanent) { const hours=Number(req.body?.hours); if (!Number.isInteger(hours)||hours<1||hours>8760) return res.status(400).json({message:"Hours must be 1–8760"}); expires=new Date(Date.now()+hours*3600000) }
  try {
    const [roles]=await db.execute("SELECT role FROM moderation_roles WHERE user_id=? LIMIT 1",[id])
    if (id===Number(req.userId)||configuredAdminIds().has(String(id))||roles[0]?.role==="admin"||(req.moderationRole==="moderator"&&roles[0]?.role==="moderator")) return res.status(403).json({message:"Cannot ban this account"})
    const [[target]]=await db.execute("SELECT id FROM users WHERE id=?",[id])
    if (!target) return res.status(404).json({message:"User not found"})
    await db.execute("INSERT INTO moderation_sanctions (target_user_id,actor_user_id,action,reason,expires_at,created_at) VALUES (?,?,?,?,?,NOW())",[id,req.userId,permanent?"permanent_ban":"temp_ban",reason,expires])
    await audit(req.userId,id,permanent?"permanent_ban":"temp_ban",reason,{hours:req.body?.hours||null})
    res.status(201).json({message:"Ban recorded"})
  } catch(e) { console.error("[Moderation] ban",e); res.status(500).json({message:"Unable to ban user"}) }
})
router.post("/users/:id/unban", requireAdmin, async (req,res) => {
  if (!validId(req.params.id)) return res.status(400).json({message:"Invalid user id"})
  try { const id=Number(req.params.id),reason=reasonText(req.body?.reason)||"Ban lifted by administrator"; await db.execute("UPDATE moderation_sanctions SET revoked_at=NOW(),revoked_by=? WHERE target_user_id=? AND action IN ('temp_ban','permanent_ban') AND revoked_at IS NULL",[req.userId,id]); await audit(req.userId,id,"unban",reason); res.json({message:"Ban lifted"}) }
  catch(e) { console.error("[Moderation] unban",e); res.status(500).json({message:"Unable to lift ban"}) }
})
router.post("/users/:id/role", requireAdmin, async (req,res) => {
  if (!validId(req.params.id)) return res.status(400).json({message:"Invalid user id"})
  const id=Number(req.params.id), role=req.body?.role
  if (!["user","moderator"].includes(role)) return res.status(400).json({message:"Role must be user or moderator; admin is server-configured"})
  if (id===Number(req.userId)||configuredAdminIds().has(String(id))) return res.status(400).json({message:"Administrator roles are managed on the server"})
  try { const [[target]]=await db.execute("SELECT id FROM users WHERE id=?",[id]); if(!target)return res.status(404).json({message:"User not found"}); await db.execute("INSERT INTO moderation_roles (user_id,role,granted_by,updated_at) VALUES (?,?,?,NOW()) ON DUPLICATE KEY UPDATE role=VALUES(role),granted_by=VALUES(granted_by),updated_at=NOW()",[id,role,req.userId]); await audit(req.userId,id,"role_change","Role updated",{role}); res.json({message:"Role updated",role}) }
  catch(e) { console.error("[Moderation] role",e); res.status(500).json({message:"Unable to update role"}) }
})
router.post("/users/:id/ip-ban", requireAdmin, async (req,res) => {
  if (process.env.GRINDLY_TRUSTED_PROXY_IP_BANS!=="true") return res.status(503).json({message:"IP bans disabled until the production proxy is verified"})
  if (!validId(req.params.id)) return res.status(400).json({message:"Invalid user id"})
  const reason=reasonText(req.body?.reason)
  if(reason.length<3)return res.status(400).json({message:"A reason is required"})
  try {
    const [[target]]=await db.execute("SELECT id FROM users WHERE id=?",[Number(req.params.id)])
    if(!target)return res.status(404).json({message:"User not found"})
    const ip=String(req.socket?.remoteAddress||"")
    if(!ip||ip==="::1"||ip==="127.0.0.1")return res.status(400).json({message:"Unable to determine public client IP"})
    const hash=crypto.createHash("sha256").update(ip).digest("hex")
    await db.execute("INSERT INTO moderation_ip_bans (user_id,ip_hash,reason,actor_user_id,created_at) VALUES (?,?,?,?,NOW())",[target.id,hash,reason,req.userId])
    await audit(req.userId,target.id,"ip_ban",reason,{ip_hash:hash})
    res.status(201).json({message:"IP ban recorded; proxy-level enforcement must be configured separately"})
  } catch(e) { console.error("[Moderation] IP ban",e); res.status(500).json({message:"Unable to record IP ban"}) }
})
router.get("/audit", requireAdmin, async (_req,res) => {
  try { const [rows]=await db.execute("SELECT id,actor_user_id,target_user_id,action,reason,metadata_json,created_at FROM moderation_audit ORDER BY created_at DESC LIMIT 200"); res.json(rows) }
  catch(e) { console.error("[Moderation] audit",e); res.status(500).json({message:"Unable to load audit log"}) }
})
module.exports=router
