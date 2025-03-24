/*
Domácí úkol č.3.
Vytvořte server, který budou reagovat na tři různé požadavky z prohlížeče. /increase, /decrease a /read (celý URL v prohlížeči bude tedy například
 http://localhost:3000/increase). Při zavolání přes cestu /increase a /decrease bude server zvyšovat/snižovat o jedničku číslo, které bude mít
  uložené v souboru counter.txt (pokud soubor neexistuje, tak ho server založí s úvodním číslem 0). U těchto dvou cest může server vrátit
   libovolnou odpověď (například text OK). Při zavolání serveru přes cestu /read vrátí server prohlížeči číslo uložené v souboru counter.txt.
 
Možnost získání bonusového bodu:
Implementujte server tak, aby se vám neopakoval společný kód pro /increase /decrease (kontrola zda soubor existuje, 
načtení čísla ze souboru, vrácení odpovědi prohlížeči, ...). Můžete jednotlivé kroky například rozdělit do funkcí, které následně budete přepoužívat,
 nebo můžete vytvořit jednu generickou/higher order funkci, která bude přijímat vstupní parametr rozhodující, zda se má číslo o jedničku zvětši/zmenšit.
*/

import http from 'http'
import path from 'path'
import chalk from 'chalk'
import fs from 'fs/promises'

const port = 3000

const server = http.createServer(async (req, res) => {

  const uri = req.url.slice(1)
  const file = path.join('public', 'counter.txt')

  try {
   console.log(uri)
   console.log(file)
   let count = await getCount(file);
   count = handleUri(uri, count)
   
   await writeNewCount(count)
   const data = await fs.readFile(file)

    res.statusCode = 200 // OK
    res.write(data)
  } catch (err) {
    res.statusCode = 404 // Not found
    res.write('404 - Not found\n' + err.message)
  } finally {
    res.end()
  }
})

function handleUri(uri, count) {
   if (uri == 'decrease') {
      count = count - 1
   } else if (uri == 'increase') {
      count = count + 1
   } else if (uri != '') {
      throw new Error("(Unknown uri)");
   }
   return count
}

async function getCount(file) {
   let count
   try {
      const data = await fs.readFile(file)
      count = getCountFromText(data.toString()) 
   } catch {
      count = 0
   }
   return count
}

function getCountFromText(text) {
   const lines =  text.split(/\r?\n/)
   if (lines.length != 2) {
      console.error('unexpected error')
      return
   }
   return Number(lines[1].trim())
}

async function writeNewCount(count) {
   const file = 'public/counter.txt';
   await fs.writeFile(file, String( 'count is:\n' + count))
}

server.listen(port, () => {
  console.log(chalk.green(`Server listening at http://localhost:${port}`))
})