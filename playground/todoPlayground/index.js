/*
Do vaší Todo aplikace přidejte novou migraci přidávající nový sloupeček do tabulky todos - například priority, enum (výčet možností) s možnostmi normal, 
low a high. Pozor, neupravujte stávající migraci. Zároveň tento nový sloupeček nějak zobrazte na seznamu todoček, na detailu todočka a umožňěte ho upravovat 
z detailu todočka (buďto pomocí nového formuláře nebo rozšiřte již existující formulář na úpravu titulku).
*/

import { serve } from  '@hono/node-server'
import { app, injectWebSocket } from "./src/app.js"


const server = serve(app, (info) => {
    console.log('App started on http://localhost:' + info.port)
})

injectWebSocket(server)
