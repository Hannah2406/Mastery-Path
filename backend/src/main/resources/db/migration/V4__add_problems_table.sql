-- Add problems table to store multiple practice problems per node
CREATE TABLE problem (
    id BIGSERIAL PRIMARY KEY,
    node_id BIGINT NOT NULL REFERENCES node(id) ON DELETE CASCADE,
    problem_text TEXT NOT NULL,
    solution_text TEXT,
    difficulty INT DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_problem_node ON problem(node_id);

-- Add some sample AMC8 problems for each topic
-- Algebra problems
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
-- Basic Arithmetic (node 101)
(101, 'What is 15 + 27?', '42', 1),
(101, 'Calculate 48 - 19.', '29', 1),
(101, 'What is 7 × 8?', '56', 1),
(101, 'Find 144 ÷ 12.', '12', 1),
(101, 'What is 25 + 37 - 18?', '44', 2),
-- Order of Operations (node 102)
(102, 'Evaluate: 2 + 3 × 4', '14', 2),
(102, 'What is (10 - 3) × 2?', '14', 2),
(102, 'Calculate: 20 ÷ 4 + 3 × 2', '11', 2),
(102, 'Find: 5² - 3 × 4', '13', 2),
-- Fractions & Decimals (node 103)
(103, 'What is 1/2 + 1/4?', '3/4', 2),
(103, 'Convert 0.75 to a fraction.', '3/4', 2),
(103, 'Calculate: 2/3 × 3/4', '1/2', 2),
(103, 'What is 0.6 + 0.4?', '1.0', 1),
(103, 'Find: 5/6 - 1/3', '1/2', 2),
-- Ratios & Proportions (node 104)
(104, 'If the ratio of apples to oranges is 3:2 and there are 15 apples, how many oranges are there?', '10', 2),
(104, 'A recipe calls for 2 cups of flour for every 3 cups of sugar. How much flour is needed for 9 cups of sugar?', '6 cups', 2),
(104, 'The ratio of boys to girls in a class is 4:5. If there are 27 students total, how many girls are there?', '15', 3),
-- Linear Equations (node 105)
(105, 'Solve for x: x + 5 = 12', 'x = 7', 2),
(105, 'What is the value of x if 3x - 7 = 14?', 'x = 7', 2),
(105, 'Solve: 2x + 3 = 11', 'x = 4', 2),
(105, 'If 4x - 8 = 20, what is x?', 'x = 7', 2),
-- Word Problems (node 106)
(106, 'Sarah has 24 stickers. She gives away 8 stickers. How many does she have left?', '16 stickers', 1),
(106, 'A book costs $15. If you have $50, how much change will you get back?', '$35', 1),
(106, 'Tom is 3 times as old as his sister. If his sister is 8 years old, how old is Tom?', '24 years old', 2),
(106, 'A train travels 60 miles in 2 hours. How fast is it going in miles per hour?', '30 mph', 2);

-- Geometry problems
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
-- Basic Shapes (node 107)
(107, 'How many sides does a triangle have?', '3', 1),
(107, 'What is the name of a shape with 4 equal sides?', 'Square', 1),
(107, 'How many sides does a pentagon have?', '5', 1),
(107, 'What is the sum of interior angles in a triangle?', '180 degrees', 2),
-- Perimeter & Area (node 108)
(108, 'A rectangle has length 8 cm and width 5 cm. What is its perimeter?', '26 cm', 2),
(108, 'What is the area of a square with side length 6 cm?', '36 cm²', 2),
(108, 'A triangle has base 10 cm and height 6 cm. What is its area?', '30 cm²', 2),
(108, 'Find the perimeter of a rectangle with length 12 m and width 7 m.', '38 m', 2),
-- Angles (node 109)
(109, 'What is the measure of a right angle?', '90 degrees', 1),
(109, 'Two angles that add up to 90° are called what?', 'Complementary angles', 2),
(109, 'If two angles are supplementary and one is 120°, what is the other?', '60°', 2),
(109, 'What is the sum of angles in a quadrilateral?', '360 degrees', 2),
-- Pythagorean Theorem (node 110)
(110, 'A right triangle has legs of length 3 and 4. What is the length of the hypotenuse?', '5', 2),
(110, 'If a right triangle has hypotenuse 10 and one leg 6, what is the other leg?', '8', 2),
(110, 'A right triangle has legs 5 and 12. Find the hypotenuse.', '13', 2),
-- Circles (node 111)
(111, 'What is the circumference of a circle with radius 7? (Use π ≈ 3.14)', '43.96', 2),
(111, 'Find the area of a circle with radius 5. (Use π ≈ 3.14)', '78.5', 2),
(111, 'If a circle has diameter 10, what is its radius?', '5', 1);

-- Counting & Probability problems
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
-- Basic Counting (node 112)
(112, 'How many ways can you arrange 3 books on a shelf?', '6 ways', 2),
(112, 'If you have 4 shirts and 3 pants, how many different outfits can you make?', '12 outfits', 2),
(112, 'How many 2-digit numbers can be formed using digits 1, 2, 3?', '9 numbers', 2),
-- Permutations (node 113)
(113, 'In how many ways can 4 people line up?', '24 ways', 2),
(113, 'How many ways can you arrange the letters in "MATH"?', '24 ways', 2),
(113, 'A password has 3 digits. How many possible passwords are there if digits can repeat?', '1000 passwords', 3),
-- Combinations (node 114)
(114, 'How many ways can you choose 2 items from 5 items?', '10 ways', 2),
(114, 'A committee of 3 people is chosen from 6 people. How many different committees are possible?', '20 committees', 3),
-- Basic Probability (node 115)
(115, 'What is the probability of rolling a 6 on a standard die?', '1/6', 1),
(115, 'If you flip a coin, what is the probability of getting heads?', '1/2', 1),
(115, 'A bag has 3 red marbles and 2 blue marbles. What is the probability of drawing a red marble?', '3/5', 2),
(115, 'What is the probability of rolling an even number on a die?', '1/2', 2);

-- Number Theory problems
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
-- Divisibility Rules (node 116)
(116, 'Is 48 divisible by 3?', 'Yes', 1),
(116, 'Is 125 divisible by 5?', 'Yes', 1),
(116, 'Is 246 divisible by 4?', 'No', 2),
(116, 'What is the smallest number divisible by both 3 and 4?', '12', 2),
-- Factors & Multiples (node 117)
(117, 'List all factors of 12.', '1, 2, 3, 4, 6, 12', 2),
(117, 'What are the first 5 multiples of 7?', '7, 14, 21, 28, 35', 2),
(117, 'What is the greatest common factor of 12 and 18?', '6', 2),
-- Prime Numbers (node 118)
(118, 'Is 17 a prime number?', 'Yes', 1),
(118, 'What is the prime factorization of 24?', '2³ × 3', 2),
(118, 'List all prime numbers between 10 and 20.', '11, 13, 17, 19', 2),
-- GCD & LCM (node 119)
(119, 'Find the GCD of 15 and 25.', '5', 2),
(119, 'What is the LCM of 4 and 6?', '12', 2),
(119, 'Find the GCD and LCM of 8 and 12.', 'GCD = 4, LCM = 24', 3);

-- Reset sequence
SELECT setval('problem_id_seq', 100);
