import test from "ava"
 
 const fizzbuzz = (n) => {
   if (n % 15 === 0) return "fizzbuzz"
   if (n % 5 === 0) return "buzz"
   if (n % 3 === 0) return "fizz"
   return n
 }
 
 test("fizzbuzz(3) is fizz", (t) => {
   t.is(fizzbuzz(3), "fizz")
 })
 
 test("fizzbuz(5) is buzz", (t) => {
   t.is(fizzbuzz(5), "buzz")
 })
 
 test("fizzbuzz(15) is fizzbuzz", (t) => {
   t.is(fizzbuzz(15), "fizzbuzz")
 })
 
 test("fizzbuzz(30) is fizzbuzz", (t) => {
   t.is(fizzbuzz(30), "fizzbuzz")
 })
 
 test("fizzbuz(10) is buzz", (t) => {
   t.is(fizzbuzz(10), "buzz")
 })
 
 test("fizzbuzz(7) is 7", (t) => {
   t.is(fizzbuzz(7), 7)
 })
 
 test("fizzbuzz(6) is fizz", (t) => {
   t.is(fizzbuzz(6), "fizz")
 })