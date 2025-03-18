/*
Vytvořte program, který bude kopírovat obsah souboru do druhého souboru na základě jednoduchých instrukcí.
ři spuštění si program načte obsah souboru s názvem "instrukce.txt". 
V tomto souboru budou uloženy dva názvy souborů.
První název označuje zdrojový soubor (ze kterého bude program kopírovat data) a druhý název označuje cílový soubor do kterého bude program data kopírovat. 
Soubor "instrukce.txt" a zdrojový soubor musí existovat, pokud neexistují, program o tom informuje uživatele. 
Pokud neexistuje cílový soubor, program ho nejprve vytvoří a pak do něj nakopíruje data. Formát instrukcí nechám na vás.
 
Příklad:
Obsahu souboru instrukce.txt: "vstup.txt vystup.txt"
Obsah souboru vstup.txt: "lorem ipsum dolor sit amet"
Spustím program pomoci "node index.mjs"
Vznikne soubor vystup.txt s obsahem "lorem ipsum dolor sit amet"
*/


import fs from 'fs'

const inst = 'instrukce.txt'


doItAll();

function doItAll() {
    readFileText(inst, text => {
        let instructions;
        instructions = (getRows(text));
        if (instructions.length != 2) {
            console.warn("Instrctions aren't sufficient. Either source or target is missing or there are too many rows.");
            return;
        }

        let zdroj = instructions[0]
        let cil = instructions[1]

        readFileText(zdroj, zdrojText => {
            console.log(zdrojText)
            writeToFile(cil, zdrojText);
        })
    })
}

function readFileText(file, callback) {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(`Reading file ${file} error`);
            return;   
        } 
        callback(data.toString());
    });
}

function getRows(string) {
    return string.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function writeToFile(file, text) {
    fs.writeFile(file, text, (err) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.log("Success!");
      })
}