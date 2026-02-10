-- Additional AMC8 practice questions per topic (more variety for each node)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
-- Basic Arithmetic (101) - more questions
(101, 'What is 23 × 4?', '92', 1),
(101, 'Calculate 81 ÷ 9.', '9', 1),
(101, 'Find 56 + 44 - 30.', '70', 2),
-- Order of Operations (102)
(102, 'Evaluate: 3 + 4 × 5 - 6', '17', 2),
(102, 'What is (6 + 2) × 3 ÷ 4?', '6', 2),
(102, 'Calculate: 10 - 2² × 2', '2', 2),
-- Fractions & Decimals (103)
(103, 'What is 1/3 + 1/6?', '1/2', 2),
(103, 'Convert 2/5 to a decimal.', '0.4', 2),
(103, 'Calculate: 0.25 × 4', '1.0', 1),
-- Ratios & Proportions (104)
(104, 'If 5 pencils cost $2, how much do 15 pencils cost?', '$6', 2),
(104, 'The ratio of red to blue marbles is 2:3. If there are 10 red marbles, how many blue?', '15', 2),
-- Linear Equations (105)
(105, 'Solve: 5x + 2 = 17', 'x = 3', 2),
(105, 'If 2(x - 3) = 10, what is x?', 'x = 8', 2),
-- Word Problems (106)
(106, 'A store sells 3 apples for $1. How much for 12 apples?', '$4', 2),
(106, 'Jake is twice as old as his sister. If his sister is 6, how old is Jake?', '12 years old', 2),
-- Basic Shapes (107)
(107, 'How many vertices does a hexagon have?', '6', 1),
(107, 'What shape has 4 equal sides and 4 right angles?', 'Square', 1),
-- Perimeter & Area (108)
(108, 'A square has perimeter 24 cm. What is its area?', '36 cm²', 2),
(108, 'Find the area of a triangle with base 12 and height 5.', '30', 2),
-- Angles (109)
(109, 'Two angles form a straight line. If one is 70°, what is the other?', '110°', 2),
(109, 'In a triangle, two angles are 50° and 60°. What is the third?', '70°', 2),
-- Pythagorean Theorem (110)
(110, 'A right triangle has legs 6 and 8. Find the hypotenuse.', '10', 2),
(110, 'The hypotenuse of a right triangle is 15 and one leg is 9. Find the other leg.', '12', 2),
-- Circles (111)
(111, 'A circle has radius 4. What is its area? (Use π ≈ 3.14)', '50.24', 2),
(111, 'What is the circumference of a circle with diameter 14? (Use π ≈ 3.14)', '43.96', 2),
-- Basic Counting (112)
(112, 'How many ways can you choose a captain and vice-captain from 5 people?', '20 ways', 2),
(112, 'How many 3-digit numbers can you make with digits 2, 4, 6 (no repeat)?', '6 numbers', 2),
-- Permutations (113)
(113, 'In how many ways can 5 books be arranged on a shelf?', '120 ways', 2),
(113, 'How many ways can you arrange the letters in "BOOK"?', '12 ways', 3),
-- Combinations (114)
(114, 'How many ways to choose 3 people from 7?', '35 ways', 3),
(114, 'A pizza place has 8 toppings. How many 2-topping pizzas?', '28 pizzas', 2),
-- Basic Probability (115)
(115, 'You roll two dice. What is the probability both show 4?', '1/36', 2),
(115, 'A bag has 4 green and 4 red balls. What is P(drawing green)?', '1/2', 1),
-- Divisibility Rules (116)
(116, 'Is 372 divisible by 6?', 'Yes', 2),
(116, 'What digit makes 4_6 divisible by 3?', '2, 5, or 8', 2),
-- Factors & Multiples (117)
(117, 'What is the LCM of 5 and 7?', '35', 2),
(117, 'How many factors does 18 have?', '6 factors', 2),
-- Prime Numbers (118)
(118, 'What is the smallest prime greater than 20?', '23', 2),
(118, 'Express 36 as a product of primes.', '2² × 3²', 2),
-- GCD & LCM (119)
(119, 'Find the LCM of 5 and 12.', '60', 2),
(119, 'What is the GCD of 24 and 36?', '12', 2);
