import { tinytext } from "drizzle-orm/mysql-core"
import {
    sqliteTable,
    int,
    text
} from "drizzle-orm/sqlite-core"

export const todosTable = sqliteTable("todos", {
    id: int().primaryKey({autoIncrement: true}),
    title: text().notNull(),
    done: int({ mode: "boolean"}).notNull(),
    priority: text().notNull().default('normal'),
}//, zatím mi nejde.. :
// https://orm.drizzle.team/docs/indexes-constraints
//(table) => [
    //check("priority_check", sql`${table.priority} in ('low','normal','high')`),
  //  check("done_check", sql`${table.done} in ('1','0'`)
//]
);