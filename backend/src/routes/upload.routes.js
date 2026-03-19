const express = require("express")
const multer = require("multer")
const cloudinary = require("../config/cloudinary")
const db = require("../config/db")

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/avatar", upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" })

        // Vérification taille max 5MB
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File too large (max 5MB)" })
        }

        // Vérification type
        const allowed = ["image/jpeg", "image/png", "image/webp"]
        if (!allowed.includes(req.file.mimetype)) {
            return res.status(400).json({ message: "Only JPG, PNG, WebP allowed" })
        }

        // Upload sur Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "taskflow/avatars",
                    transformation: [
                        { width: 200, height: 200, crop: "fill", gravity: "face" },
                        { quality: "auto", fetch_format: "auto" }
                    ],
                    moderation: "aws_rek" // modération automatique
                },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                }
            ).end(req.file.buffer)
        })

        // Sauvegarde l'URL en BDD
        await db.execute(
            "UPDATE users SET avatar_url = ? WHERE id = ?",
            [result.secure_url, req.userId]
        )

        res.json({ avatar_url: result.secure_url })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Upload failed" })
    }
})

module.exports = router