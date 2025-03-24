/*
Pomoci modulu "fs/promises" a async await napište následující program:
Program nejprve přečte obsah souboru "instrukce.txt", ve kterém bude číslo (například 10).
Následně program vytvoří n souborů (kde n se rovná číslu ze souboru instrukce.txt) s názvy 0.txt, 1.txt, 2.txt až n.txt 
a obsahem "Soubor 0", "Soubor 1", "Soubor 2" až "Soubor n".
Poté co budou všechny soubory úspěšně vytvořeny, vypíše program informativní hlášku do konzole a skončí. 
Základní program za 2 body bude může být sériový. Pokročilejší program za 3 body musí využít paralelizaci pomocí Promise.all.
*/


import fs from 'fs/promises'

const inst = 'instrukce.txt'

doItAll(inst);

async function doItAll(instFile) {
    try {
        const content = await fs.readFile(instFile, 'utf8');
        console.log(`Content is: ${content}`);
        const number = Number(content);
        if (!Number.isInteger(number)) {
            console.log("Instruction file contains an invalid number.");
            return;
        }
        const promises = [];
        for (let i = 0; i <= number; i++) {
            promises.push(createFile(i));
        }
        await Promise.all(promises);

        console.log(`Successfully created ${number + 1} files.`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

async function createFile(number) {
    const file = number + '.txt';
    const text = 'Soubor ' + number;
    await fs.writeFile(file, text);
    console.log(number);
}