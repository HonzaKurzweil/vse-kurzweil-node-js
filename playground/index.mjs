import fs from 'fs'


fs.readFile('count.txt', (err, data) => {
  if (err) {
    console.log("that error")
    fs.writeFile('count.txt', '0', (err) => {
      if (err) {
        console.log("this error")
        console.error(err.message)
      } else {
        printDataAndWriteNewCount('0')
      }
    })
  } else {
    console.log("here")
    printDataAndWriteNewCount(data.toString())
  }
})

const printDataAndWriteNewCount = (data) => {
  let number = Number(data)
  console.log(number)
  number++
  fs.writeFile('count.txt', String(number), (err) => {
    if (err) {
      console.error(err.message)
    }
  })
}