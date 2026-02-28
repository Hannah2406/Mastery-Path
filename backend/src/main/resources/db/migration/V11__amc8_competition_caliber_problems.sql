-- Replace easy AMC8 problems with competition-caliber difficulty.
-- Problems match real AMC 8 style: multi-step, non-trivial, require insight.

-- Remove existing easy problems for AMC8 nodes (101-119 per V2 seed)
DELETE FROM problem WHERE node_id BETWEEN 101 AND 119;

-- Algebra: Basic Arithmetic / Percent & reverse thinking (101)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(101, 'After a 20% discount, a price becomes $48. Then sales tax of 13% is added. What was the original price before the discount?', 'Let P = original price. After 20% discount: 0.8P = 48, so P = 60. After 13% tax on $48: 48(1.13) = 54.24. The question asks original price: $60.', 4),
(101, 'A number is increased by 25%, then the result is decreased by 20%. What single percent change would give the same final value?', 'Let n be original. After +25%: 1.25n. After -20%: 1.25n(0.8) = n. So no net change; 0% or "no change".', 4),
(101, 'The sum of two numbers is 50 and their difference is 14. What is the larger number?', 'Let a+b=50, a-b=14. Adding: 2a=64, a=32. Larger is 32.', 3);

-- Algebra: Order of Operations / systems (102)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(102, 'Real numbers x, y satisfy x + y = 7 and x² + y² = 29. What is xy?', '(x+y)² = x² + 2xy + y², so 49 = 29 + 2xy, hence 2xy = 20, xy = 10.', 4),
(102, 'If a ⊕ b = 2a + 3b and a ⊗ b = a² - b, what is (3 ⊕ 2) ⊗ 4?', '3 ⊕ 2 = 2(3)+3(2) = 12. Then 12 ⊗ 4 = 12² - 4 = 144 - 4 = 140.', 4),
(102, 'Evaluate: 1² - 2² + 3² - 4² + 5² - 6².', 'Pair: (1-2)(1+2)+(3-4)(3+4)+(5-6)(5+6) = -3-7-11 = -21.', 4),
(102, 'If 2^x · 3^y = 864 and x, y are positive integers, what is x + y?', '864 = 2^5 · 3^3, so x=5, y=3, x+y=8.', 4);

-- Fractions & Decimals (103) – non-trivial
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(103, 'When 0.363636... is written as a fraction in lowest terms, what is the denominator?', 'x = 0.36 repeating. 100x = 36.36..., so 99x = 36, x = 36/99 = 4/11. Denominator is 11.', 4),
(103, 'What is 1/(1·2) + 1/(2·3) + 1/(3·4) + 1/(4·5)?', 'Telescopes: (1-1/2)+(1/2-1/3)+(1/3-1/4)+(1/4-1/5) = 1 - 1/5 = 4/5.', 4),
(103, 'If 2/3 of a number is 24, what is 5/6 of that number?', 'Number = 24/(2/3) = 36. Then 5/6 of 36 = 30.', 3);

-- Ratios & Proportions (104)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(104, 'The ratio of boys to girls in a class is 4:5. If 3 more girls join, the ratio becomes 4:6. How many boys are in the class?', 'Let 4k boys, 5k girls. (4k)/(5k+3) = 4/6 ⇒ 24k = 20k+12 ⇒ k=3. Boys = 12.', 4),
(104, 'In what ratio must rice at $3/kg be mixed with rice at $5/kg so that the mixture is $4/kg?', 'Let a kg at $3, b kg at $5. 3a+5b = 4(a+b) ⇒ a = b. Ratio 1:1.', 4);

-- Linear Equations / Word (105, 106)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(105, 'Machine A can fill a tank in 6 hours and Machine B can fill it in 10 hours. They run together for 2 hours, then A breaks. How much longer (in hours) will B take to finish filling the tank?', 'In 2 hours: A does 2/6, B does 2/10; total 1/3+1/5 = 8/15. Left: 7/15. B fills at 1/10 per hour: (7/15)/(1/10) = 14/3 hours.', 4),
(106, 'Machine A fills a tank in 6 hours, B in 10 hours. Both run 2 hours, then A stops. How many more hours for B to finish?', 'Same as above: 14/3 hours.', 4),
(106, 'You start with the number 1. Each move you may either add 5 or multiply by 2. What is the smallest number greater than 200 that you can reach?', 'Work backwards from >200. 208 = 104·2, 104 = 52·2, 52 = 26·2, 26 = 13·2, 13 = 8+5, 8 = 4·2, 4 = 2·2, 2 = 1·2. So 208 is reachable. Check 201-207: 201=196+5 no; 203=198+5 no; ... 208 works. Answer: 208.', 5);

-- Geometry: Basic Shapes / Perimeter & Area (107, 108)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(107, 'A circle has radius 10. A chord is 12 units long. What is the distance from the center of the circle to the chord?', 'Half-chord = 6. By Pythagorean theorem, distance = √(10² - 6²) = √64 = 8.', 4),
(108, 'Points A(0,0), B(6,0), and C(0,8). Point D is on segment BC such that BD:DC = 1:3. What is the area of triangle ABD?', 'BC from (6,0) to (0,8). D = (6·3/4, 0·1/4) = (4.5, 2) or use section formula. Area ABD: base AB=6, height = y-coord of D = 2, area = 6.', 4),
(108, 'A rectangle has perimeter 28 and area 48. What is the length of its diagonal?', '2(l+w)=28, lw=48. So l+w=14, lw=48. Diagonal² = l²+w² = (l+w)²-2lw = 196-96 = 100, diagonal = 10.', 4);

-- Angles (109), Pythagorean (110), Circles (111)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(109, 'In a convex pentagon, three angles are 90°, 100°, and 110°. The other two angles are equal. What is each?', 'Sum of interior angles = (5-2)·180 = 540. Other two sum = 540-300 = 240, each 120°.', 3),
(110, 'A right triangle has legs 5 and 12. What is the radius of the circle inscribed in this triangle?', 'Hypotenuse = 13. Inradius r = (a+b-c)/2 = (5+12-13)/2 = 2.', 4),
(111, 'Two concentric circles have radii 5 and 13. What is the length of a chord of the larger circle that is tangent to the smaller circle?', 'Chord tangent to inner circle: half-chord = √(13²-5²) = 12. Length = 24.', 4);

-- Counting & Probability (112-115)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(112, 'How many integers from 1 to 999 have exactly one digit equal to 7?', 'Casework: 7 in hundreds (1·9·9) + 7 in tens (8·1·9) + 7 in ones (8·9·1) = 81+72+72 = 225.', 4),
(113, 'Six people sit around a round table. Two particular people refuse to sit next to each other. How many distinct seatings are possible?', 'Total circular permutations = 5! = 120. Count bad: treat the two as block: 4!·2 = 48. Answer: 120 - 48 = 72.', 4),
(114, 'How many 4-digit numbers have at least one 7?', 'Total 4-digit: 9·10³ = 9000. No 7: 8·9³ = 5832. At least one 7: 9000 - 5832 = 3168.', 4),
(115, 'A fair die is rolled twice. Given that the sum is at least 10, what is the probability the sum is exactly 10?', 'Sums ≥10: (4,6),(5,5),(6,4),(5,6),(6,5),(6,6) = 6 outcomes. Exactly 10: (4,6),(5,5),(6,4) = 3. Probability = 3/6 = 1/2.', 4);

-- Number Theory (116-119)
INSERT INTO problem (node_id, problem_text, solution_text, difficulty) VALUES
(116, 'What is the remainder when 3^2026 + 5^2026 is divided by 8?', '3²≡1, 3^2026≡(3²)^1013≡1. 5²≡1, 5^2026≡1. Sum ≡ 1+1 = 2 (mod 8). Remainder 2.', 5),
(117, 'How many positive divisors does 2^4 · 3^3 have?', '(4+1)(3+1) = 20 divisors.', 3),
(118, 'What is the smallest positive integer n such that n! is divisible by 2^10?', 'Count factors of 2 in n!: ⌊n/2⌋+⌊n/4⌋+⌊n/8⌋+... ≥ 10. n=8: 4+2+1=7; n=10: 5+2+1=8; n=12: 6+3+1=10. So n=12.', 4),
(119, 'Find the GCD of 2^10·3^5 and 2^4·3^8.', 'GCD = 2^4·3^5 = 16·243 = 3888.', 3);
