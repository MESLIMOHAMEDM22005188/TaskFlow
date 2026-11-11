use axum::{extract::State, Json};
use maud::{html, Markup, DOCTYPE};
use serde::Serialize;

use crate::AppState;

#[derive(Serialize)]
pub struct Health {
    status: &'static str,
    persistence: &'static str,
}

pub async fn health(State(state): State<AppState>) -> Json<Health> {
    Json(Health {
        status: "ok",
        persistence: if state.db.is_some() { "connected" } else { "preview" },
    })
}

pub async fn home() -> Markup {
    html! {
        (DOCTYPE)
        html lang="fr" {
            head {
                meta charset="utf-8";
                meta name="viewport" content="width=device-width, initial-scale=1";
                meta name="theme-color" content="#111318";
                title { "Grindly — Ton espace de progression" }
                style {
                    (maud::PreEscaped(STYLES))
                }
            }
            body {
                div class="app-shell" {
                    aside class="rail" {
                        div class="brand-mark" { "g" }
                        a class="rail-item active" href="/" title="Accueil" { "⌂" }
                        a class="rail-item" href="#communautes" title="Communautés" { "◎" }
                        a class="rail-item" href="#messages" title="Messages" { "✉" }
                        div class="rail-spacer" {}
                        div class="avatar self" { "S" }
                    }
                    aside class="servers" {
                        div class="workspace-head" {
                            div class="eyebrow" { "ESPACE PERSONNEL" }
                            h2 { "Grindly" }
                            p class="muted" { "Construis ton élan." }
                        }
                        div class="section-label" { "TON ESPACE" }
                        a class="nav-link selected" href="#overview" { span { "◫" } " Vue d’ensemble" }
                        a class="nav-link" href="#tasks" { span { "✓" } " Mes tâches" }
                        a class="nav-link" href="#habits" { span { "↗" } " Habitudes" }
                        a class="nav-link" href="#focus" { span { "◷" } " Focus room" }
                        div class="section-row" id="communautes" {
                            span class="section-label" { "COMMUNAUTÉS" }
                            button class="icon-button" title="Ajouter" { "+" }
                        }
                        a class="channel selected" href="#general" { span class="hash" { "#" } " général" }
                        a class="channel" href="#entraide" { span class="hash" { "#" } " entraide" }
                        a class="channel" href="#defis" { span class="hash" { "#" } " défis-collectifs" }
                        a class="channel" href="#victoires" { span class="hash" { "#" } " petites-victoires" }
                        div class="servers-bottom" {
                            div class="avatar small" { "S" }
                            div class="user-meta" { strong { "Ton profil" } small { "Niveau 4 · Explorateur" } }
                            button class="icon-button" title="Paramètres" { "⚙" }
                        }
                    }
                    main class="main-panel" {
                        header class="topbar" {
                            div class="breadcrumb" { span { "Grindly" } " / " strong { "Vue d’ensemble" } }
                            div class="top-actions" {
                                span class="live-pill" { span class="live-dot" {} " EN DIRECT" }
                                button class="icon-button" title="Notifications" { "♧" }
                                button class="avatar small" title="Profil" { "S" }
                            }
                        }
                        section class="content" id="overview" {
                            div class="welcome-row" {
                                div {
                                    div class="eyebrow accent" { "MERCREDI · TON ESPACE" }
                                    h1 { "Fais avancer tes projets." }
                                    p class="muted" { "Seul ou avec les autres, chaque petit pas compte." }
                                }
                                button class="primary-button" { "+ Nouvelle tâche" }
                            }
                            div class="stats-grid" {
                                div class="stat-card" { small { "TÂCHES TERMINÉES" } strong { "12" } span class="stat-note positive" { "↑ 3 cette semaine" } }
                                div class="stat-card" { small { "SÉRIE EN COURS" } strong { "6 jours" } span class="stat-note" { "Garde le rythme" } }
                                div class="stat-card" { small { "TEMPS DE FOCUS" } strong { "4h 20" } span class="stat-note" { "Cette semaine" } }
                            }
                            div class="dashboard-grid" {
                                section class="panel task-panel" id="tasks" {
                                    div class="panel-heading" { div { h3 { "À faire aujourd’hui" } p class="muted" { "Ton prochain pas, pas toute la montagne." } } a href="#tasks" { "Tout voir →" } }
                                    div class="task-row" { span class="task-check" {} div { strong { "Finaliser le dossier" } small { "Projet personnel · Priorité haute" } } span class="tag violet" { "Aujourd’hui" } }
                                    div class="task-row" { span class="task-check" {} div { strong { "Réviser 30 minutes" } small { "Apprentissage · Focus" } } span class="tag" { "18:00" } }
                                    div class="task-row" { span class="task-check done" { "✓" } div class="completed" { strong { "Planifier la semaine" } small { "Organisation · Terminé" } } span class="tag green" { "Fait" } }
                                }
                                section class="panel community-panel" id="messages" {
                                    div class="panel-heading" { div { h3 { "# général" } p class="muted" { "Le salon de la communauté" } } span class="online-count" { span class="live-dot" {} " 8 en ligne" } }
                                    div class="message-list" id="messages-list" {
                                        div class="message" { div class="avatar coral" { "N" } div { strong { "Nora" } small { " 14:32" } p { "Petit objectif du jour : avancer même 20 minutes. Qui est partant ?" } } }
                                        div class="message" { div class="avatar blue" { "Y" } div { strong { "Yacine" } small { " 14:35" } p { "J’ai lancé une session focus, rejoignez-moi !" } } }
                                        div class="message system-message" { "Les messages de démonstration ne sont pas enregistrés." }
                                    }
                                    form id="chat-form" class="chat-form" {
                                        input id="chat-input" maxlength="1000" placeholder="Écrire dans #général..." autocomplete="off";
                                        button type="submit" aria-label="Envoyer" { "↑" }
                                    }
                                }
                            }
                            section class="panel habits-panel" id="habits" {
                                div class="panel-heading" { div { h3 { "Tes habitudes" } p class="muted" { "La régularité fait le travail." } } a href="#habits" { "Voir le suivi →" } }
                                div class="habit-grid" {
                                    div class="habit-item" { span class="habit-icon" { "📖" } div { strong { "Lecture" } small { "4 / 5 jours" } } div class="progress" { span style="width:80%" {} } }
                                    div class="habit-item" { span class="habit-icon" { "💻" } div { strong { "Code" } small { "6 / 7 jours" } } div class="progress" { span style="width:86%" {} } }
                                    div class="habit-item" { span class="habit-icon" { "🏊" } div { strong { "Sport" } small { "2 / 3 séances" } } div class="progress" { span style="width:66%" {} } }
                                }
                            }
                        }
                    }
                    aside class="right-panel" {
                        div class="right-head" { h3 { "Communauté" } button class="icon-button" { "•••" } }
                        div class="community-card" {
                            div class="community-banner" { "✦" }
                            h3 { "Les bâtisseurs" }
                            p class="muted" { "Un pas après l’autre." }
                            div class="member-stack" { span class="avatar coral" { "N" } span class="avatar blue" { "Y" } span class="avatar green" { "A" } span class="avatar more" { "+5" } }
                            small class="muted" { "8 membres en ligne" }
                            button class="secondary-button" { "Ouvrir la communauté" }
                        }
                        div class="section-label right-label" { "ACTIVITÉ RÉCENTE" }
                        div class="activity-item" { span class="activity-icon" { "🏆" } div { strong { "Nouveau badge" } small { "Série de 5 jours · Il y a 2h" } } }
                        div class="activity-item" { span class="activity-icon" { "⚡" } div { strong { "Défi collectif" } small { "12 tâches validées aujourd’hui" } } }
                        div class="quote-card" { p { "« Le progrès est une somme de petites victoires. »" } small { "TON RAPPEL DU JOUR" } }
                    }
                }
                script { (maud::PreEscaped(SCRIPT)) }
            }
        }
    }
}

const STYLES: &str = r#"
:root{color-scheme:dark;--bg:#111318;--panel:#191c24;--panel2:#20242e;--line:#2b303b;--text:#eef0f6;--muted:#9299aa;--accent:#a78bfa;--accent2:#8064e8;--green:#55c99a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}a{color:inherit;text-decoration:none}button,input{font:inherit}.app-shell{min-height:100vh;display:grid;grid-template-columns:68px 244px minmax(420px,1fr) 270px}.rail{background:#0d0f14;border-right:1px solid var(--line);display:flex;align-items:center;flex-direction:column;gap:14px;padding:18px 0}.brand-mark{width:42px;height:42px;border-radius:15px;background:linear-gradient(145deg,#b69aff,#7257db);display:grid;place-items:center;font-size:25px;font-weight:900;color:#171322;margin-bottom:14px}.rail-item{width:42px;height:42px;border-radius:15px;background:#20232d;display:grid;place-items:center;color:#aeb4c3;font-size:21px}.rail-item.active{background:#514078;color:white;border-radius:14px}.rail-spacer{flex:1}.avatar{width:36px;height:36px;border-radius:50%;display:inline-grid;place-items:center;font-weight:700;background:#5d4a83;color:white;flex-shrink:0}.avatar.small{width:30px;height:30px}.servers{background:#151820;border-right:1px solid var(--line);padding:24px 15px;display:flex;flex-direction:column;min-height:100vh}.workspace-head{padding:2px 8px 26px}.workspace-head h2{font-size:20px;margin:7px 0}.workspace-head p{margin:0}.eyebrow,.section-label{font-size:10px;letter-spacing:1.2px;font-weight:800;color:#737b8e}.section-label{display:block;margin:20px 8px 9px}.muted{color:var(--muted)}.nav-link,.channel{display:flex;align-items:center;gap:11px;padding:10px 11px;border-radius:8px;color:#aeb4c3;margin:2px 0}.nav-link span{font-size:17px;width:18px;text-align:center}.nav-link.selected,.channel.selected{background:#29243a;color:#d7caff}.section-row{display:flex;align-items:center;justify-content:space-between;margin-top:17px}.section-row .section-label{margin-bottom:8px}.icon-button{border:0;background:transparent;color:#9ca3b4;font-size:17px;cursor:pointer;padding:6px}.channel{padding:8px 11px;font-size:13px}.hash{color:#747c8d;font-size:17px}.servers-bottom{margin-top:auto;border-top:1px solid var(--line);padding:15px 4px 0;display:flex;align-items:center;gap:9px}.user-meta{display:flex;flex-direction:column;gap:3px;flex:1;font-size:12px}.user-meta small{color:var(--muted);font-size:10px}.main-panel{min-width:0}.topbar{height:66px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px}.breadcrumb{color:var(--muted);font-size:13px}.breadcrumb strong{color:var(--text)}.top-actions{display:flex;align-items:center;gap:14px}.live-pill{font-size:9px;letter-spacing:1px;color:#9ca3b4;display:flex;align-items:center;gap:7px}.live-dot{width:7px;height:7px;border-radius:50%;background:#50c997;display:inline-block}.content{max-width:1180px;margin:auto;padding:32px 30px 48px}.welcome-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:25px}.welcome-row h1{font-size:27px;letter-spacing:-.8px;margin:9px 0}.welcome-row p{margin:0}.accent{color:#b39cff}.primary-button,.secondary-button{border:0;border-radius:8px;padding:11px 15px;background:var(--accent2);color:white;font-weight:700;cursor:pointer}.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-bottom:18px}.stat-card,.panel{background:var(--panel);border:1px solid var(--line);border-radius:12px}.stat-card{padding:17px 19px;display:flex;flex-direction:column;gap:8px}.stat-card small{color:var(--muted);font-size:10px;letter-spacing:.7px;font-weight:700}.stat-card strong{font-size:25px}.stat-note{font-size:11px;color:var(--muted)}.positive{color:var(--green)}.dashboard-grid{display:grid;grid-template-columns:minmax(260px,.85fr) minmax(340px,1.15fr);gap:15px}.panel{padding:19px;margin-bottom:15px;min-width:0}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.panel-heading h3,.right-head h3{font-size:15px;margin:0 0 5px}.panel-heading p{font-size:11px;margin:0}.panel-heading>a{font-size:11px;color:#b39cff;white-space:nowrap}.task-row{display:flex;align-items:center;gap:11px;padding:13px 0;border-top:1px solid #282d37}.task-row>div{display:flex;flex-direction:column;gap:5px;flex:1}.task-row strong,.habit-item strong{font-size:12px}.task-row small,.habit-item small{font-size:10px;color:var(--muted)}.task-check{width:17px;height:17px;border:1px solid #626b7e;border-radius:6px}.task-check.done{background:#398a6c;border-color:#398a6c;color:white;text-align:center;font-size:11px}.completed{opacity:.55;text-decoration:line-through}.tag{font-size:9px;color:#b6bdcb;background:#292e39;padding:5px 7px;border-radius:5px}.tag.violet{color:#c5b4ff;background:#342c4b}.tag.green{color:#7ee0b8;background:#1f3c34}.online-count{font-size:10px;color:var(--muted);white-space:nowrap}.message-list{height:205px;overflow:auto;display:flex;flex-direction:column;gap:15px;padding:7px 0}.message{display:flex;gap:10px;align-items:flex-start}.message>div:last-child{min-width:0}.message strong{font-size:11px}.message small{color:var(--muted);font-size:9px}.message p{font-size:11px;color:#c5c9d3;line-height:1.5;margin:5px 0 0}.avatar.coral{background:#8d554f}.avatar.blue{background:#466d9d}.avatar.green{background:#477b69}.system-message{font-size:10px;color:#777f90;padding-left:46px}.chat-form{display:flex;gap:8px;background:#101218;border:1px solid #303541;border-radius:8px;padding:5px 7px}.chat-form input{background:transparent;border:0;outline:0;color:white;min-width:0;flex:1;padding:7px}.chat-form button{width:30px;height:30px;border:0;border-radius:7px;background:#6d56bd;color:white;font-size:18px;cursor:pointer}.habit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.habit-item{display:grid;grid-template-columns:30px 1fr;gap:4px 9px;align-items:center}.habit-icon{grid-row:span 2;width:30px;height:30px;background:#29283a;border-radius:9px;display:grid;place-items:center}.habit-item>div:nth-child(2){display:flex;flex-direction:column;gap:4px}.progress{grid-column:2;height:4px;border-radius:4px;background:#303541;overflow:hidden}.progress span{display:block;height:100%;background:#9b82ed;border-radius:4px}.right-panel{border-left:1px solid var(--line);background:#151820;padding:23px 17px}.right-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.community-card{background:#1e222c;border:1px solid var(--line);border-radius:11px;padding:0 13px 14px;overflow:hidden}.community-banner{height:76px;margin:0 -13px 12px;background:radial-gradient(circle at 80% 20%,#a78bfa66,transparent 35%),linear-gradient(120deg,#40365f,#202a3a);display:grid;place-items:center;font-size:28px;color:#d8c9ff}.community-card h3{margin:0 0 5px;font-size:13px}.community-card p{margin:0 0 12px;font-size:11px}.member-stack{display:flex;margin:0 0 8px}.member-stack .avatar{border:2px solid #1e222c;margin-right:-7px;width:27px;height:27px;font-size:9px}.avatar.more{background:#343947;color:#c4c9d3}.community-card>small{font-size:10px}.secondary-button{width:100%;margin-top:14px;background:#343044;font-size:10px}.right-label{margin:26px 0 14px}.activity-item{display:flex;gap:10px;align-items:center;margin:14px 0}.activity-icon{width:30px;height:30px;background:#272b36;border-radius:9px;display:grid;place-items:center}.activity-item div{display:flex;flex-direction:column;gap:4px}.activity-item strong{font-size:10px}.activity-item small{font-size:9px;color:var(--muted)}.quote-card{margin-top:30px;padding:14px;border-radius:9px;background:#252237;border:1px solid #3a3352}.quote-card p{font-size:11px;line-height:1.6;color:#d9d0f5}.quote-card small{font-size:8px;color:#a99bd1;letter-spacing:1px}
@media(max-width:1150px){.app-shell{grid-template-columns:60px 210px minmax(380px,1fr)}.right-panel{display:none}.content{padding:25px 20px}}@media(max-width:760px){.app-shell{grid-template-columns:54px minmax(0,1fr)}.servers{display:none}.rail{position:sticky;top:0;height:100vh}.topbar{padding:0 15px}.content{padding:22px 14px}.welcome-row{align-items:flex-start;gap:12px;flex-direction:column}.welcome-row h1{font-size:23px}.stats-grid{gap:7px}.stat-card{padding:12px 10px}.stat-card strong{font-size:19px}.stat-card small{font-size:8px}.dashboard-grid{grid-template-columns:1fr}.habit-grid{grid-template-columns:1fr}.habit-item{margin:5px 0}.live-pill{display:none}}
"#;

const SCRIPT: &str = r#"
(() => {
 const form=document.getElementById('chat-form');
 const input=document.getElementById('chat-input');
 const list=document.getElementById('messages-list');
 if(!form||!input||!list) return;
 const protocol=location.protocol==='https:'?'wss':'ws';
 const socket=new WebSocket(protocol+'://'+location.host+'/ws?room=general');
 socket.addEventListener('message',event=>{
   let data; try{data=JSON.parse(event.data)}catch{return}
   if(!data.content)return;
   const row=document.createElement('div'); row.className='message';
   const avatar=document.createElement('div'); avatar.className='avatar blue'; avatar.textContent=(data.author||'G').slice(0,1).toUpperCase();
   const body=document.createElement('div'); const name=document.createElement('strong'); name.textContent=data.author||'Grindly';
   const text=document.createElement('p'); text.textContent=data.content;
   body.append(name,text); row.append(avatar,body); list.append(row); list.scrollTop=list.scrollHeight;
 });
 form.addEventListener('submit',event=>{
   event.preventDefault(); const content=input.value.trim();
   if(!content||socket.readyState!==WebSocket.OPEN)return;
   socket.send(JSON.stringify({id:'',room:'general',author:'Invité',content,sent_at:new Date().toISOString()}));
   input.value='';
 });
})();
"#;
