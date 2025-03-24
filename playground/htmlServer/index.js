import http from 'http'
import path from 'path'
import chalk from 'chalk'
import fs from 'fs/promises'

const port = 3000

const server = http.createServer(async (req, res) => {
	// Pomocí .slice(1) ukrojíme počáteční lomítko.
	// Z požadavku na index (samotné lomítko) se stane prázdný string
	// (falsy hodnota) a bude nahrazen stringem 'index.html'.  
  const uri = req.url.slice(1) || 'index.html'
	// Pomocí path.join spojíme obě části cesty k souboru.
  const file = path.join('public', uri)

  try {
    const data = await fs.readFile(file)

    res.statusCode = 200 // OK
    res.write(data)
  } catch {
    res.statusCode = 404 // Not found
    res.write('404 - Not found')
  } finally {
    res.end()
  }
})

server.listen(port, () => {
  console.log(chalk.green(`Server listening at http://localhost:${port}`))
})