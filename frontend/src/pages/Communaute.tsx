import { useState } from "react"
import "../assets/css/dashboard.css"

export default function Communaute(){

    const [message,setMessage] = useState("")

    return(

        <div className="dashboard">

            <h1>Communauté</h1>

            <input
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                placeholder="Write something"
            />

        </div>

    )

}