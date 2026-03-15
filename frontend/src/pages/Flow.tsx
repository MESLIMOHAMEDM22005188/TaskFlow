import "../assets/css/dashboard.css"

type FlowItem = {
    id:number
    user:string
    action:string
    target:string
    time:string
}

export default function Flow(){

    const flow:FlowItem[] = [

        {
            id:1,
            user:"Alice",
            action:"completed",
            target:"API authentication",
            time:"2h ago"
        },

        {
            id:2,
            user:"Lucas",
            action:"created",
            target:"Frontend theme",
            time:"3h ago"
        },

        {
            id:3,
            user:"Emma",
            action:"updated",
            target:"Dashboard UI",
            time:"5h ago"
        }

    ]

    return(

        <div className="dashboard">

            <header className="topbar">

                <div className="logo">
                    TaskFlow
                </div>

                <nav className="nav-menu">

                    <div className="nav-item">Dashboard</div>
                    <div className="nav-item">Objectifs</div>
                    <div className="nav-item">Flow</div>
                    <div className="nav-item">Profil</div>
                    <div className="nav-item">Communauté</div>
                    <div className="nav-item">Paramètres</div>

                    <div className="nav-icons">

                        <div className="nav-item nav-search">🔍</div>

                        <div className="nav-item nav-notif">🔔</div>

                        <div className="nav-avatar">
                            <img src="https://i.pravatar.cc/40"/>
                        </div>

                    </div>

                </nav>

            </header>


            <main className="main">

                <h1 className="title">
                    Activity Flow
                </h1>

                <section className="flow">

                    {flow.map(item =>(

                        <div key={item.id} className="flow-card">

                            <div className="flow-avatar">
                                <img src="https://i.pravatar.cc/50"/>
                            </div>

                            <div className="flow-content">

                                <div className="flow-text">

                                    <strong>{item.user}</strong> {item.action} <span>{item.target}</span>

                                </div>

                                <div className="flow-time">
                                    {item.time}
                                </div>

                            </div>

                        </div>

                    ))}

                </section>

            </main>

        </div>

    )

}