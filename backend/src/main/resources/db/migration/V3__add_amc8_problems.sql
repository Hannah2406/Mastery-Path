-- Add more AMC8 problems organized by topic
-- This expands the AMC8 problem bank with additional problems from various topics

-- Additional Algebra Problems
INSERT INTO node (id, category_id, name, description, external_key, external_url) VALUES
-- Algebra: Percentages & Rates
(120, 13, 'Percentages', 'Calculating percentages and percentage change', 'amc8-percent', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(121, 13, 'Rate Problems', 'Distance, speed, time, and work rate problems', 'amc8-rate', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(122, 13, 'Percent Increase/Decrease', 'Finding percent change and reverse calculations', 'amc8-percent-change', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(123, 13, 'Unit Conversion', 'Converting between units and measurement systems', 'amc8-units', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
-- Algebra: Advanced Equations
(124, 13, 'Systems of Equations', 'Solving two-variable linear systems', 'amc8-systems', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(125, 13, 'Inequalities', 'Solving and graphing inequalities', 'amc8-inequalities', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(126, 13, 'Absolute Value', 'Working with absolute value equations', 'amc8-abs-value', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(127, 13, 'Exponents & Powers', 'Rules of exponents and power operations', 'amc8-exponents', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(128, 13, 'Square Roots', 'Simplifying and operating with square roots', 'amc8-roots', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
-- Algebra: Patterns & Sequences
(129, 13, 'Arithmetic Sequences', 'Finding terms and sums of arithmetic sequences', 'amc8-arith-seq', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(130, 13, 'Geometric Sequences', 'Finding terms and sums of geometric sequences', 'amc8-geo-seq', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(131, 13, 'Pattern Recognition', 'Identifying and extending number patterns', 'amc8-patterns', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions');

-- Additional Geometry Problems
INSERT INTO node (id, category_id, name, description, external_key, external_url) VALUES
-- Geometry: Advanced Shapes
(132, 14, 'Triangles: Special Types', 'Equilateral, isosceles, and right triangles', 'amc8-tri-special', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(133, 14, 'Quadrilaterals', 'Properties of squares, rectangles, parallelograms, trapezoids', 'amc8-quad', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(134, 14, 'Polygons', 'Regular polygons, interior/exterior angles', 'amc8-polygons', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(135, 14, 'Similarity', 'Similar triangles and scale factors', 'amc8-similarity', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(136, 14, 'Congruence', 'Congruent triangles and proofs', 'amc8-congruence', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
-- Geometry: Advanced Circle Problems
(137, 14, 'Circle Area & Circumference', 'Advanced circle calculations', 'amc8-circle-adv', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(138, 14, 'Sectors & Arcs', 'Calculating arc length and sector area', 'amc8-sectors', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(139, 14, 'Inscribed Angles', 'Angles inscribed in circles', 'amc8-inscribed', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
-- Geometry: 3D & Transformations
(140, 14, '3D Shapes: Volume', 'Volume of prisms, pyramids, cylinders, cones, spheres', 'amc8-volume', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(141, 14, '3D Shapes: Surface Area', 'Surface area of 3D figures', 'amc8-surface', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(142, 14, 'Transformations', 'Translations, rotations, reflections, dilations', 'amc8-transforms', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(143, 14, 'Coordinate Geometry', 'Distance, midpoint, slope on coordinate plane', 'amc8-coord', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions');

-- Additional Counting & Probability Problems
INSERT INTO node (id, category_id, name, description, external_key, external_url) VALUES
-- Counting: Advanced Techniques
(144, 15, 'Casework', 'Solving problems by considering all cases', 'amc8-casework', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(145, 15, 'Complementary Counting', 'Counting by subtracting unwanted cases', 'amc8-complement', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(146, 15, 'Pigeonhole Principle', 'Applying the pigeonhole principle', 'amc8-pigeonhole', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(147, 15, 'Stars and Bars', 'Distributing identical objects', 'amc8-stars-bars', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(148, 15, 'Inclusion-Exclusion', 'Counting with overlapping sets', 'amc8-inclusion', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
-- Probability: Advanced Topics
(149, 15, 'Conditional Probability', 'Probability with given conditions', 'amc8-cond-prob', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(150, 15, 'Geometric Probability', 'Probability using area and length', 'amc8-geo-prob', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(151, 15, 'Expected Value', 'Calculating expected values', 'amc8-expected', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(152, 15, 'Tree Diagrams', 'Using tree diagrams for probability', 'amc8-tree', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions');

-- Additional Number Theory Problems
INSERT INTO node (id, category_id, name, description, external_key, external_url) VALUES
-- Number Theory: Advanced Topics
(153, 16, 'Modular Arithmetic', 'Working with remainders and mod operations', 'amc8-modular', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(154, 16, 'Digit Sum & Properties', 'Properties of digit sums and digital roots', 'amc8-digits', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(155, 16, 'Base Number Systems', 'Converting between number bases', 'amc8-bases', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(156, 16, 'Perfect Squares & Cubes', 'Identifying and working with perfect powers', 'amc8-powers', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(157, 16, 'Number Patterns', 'Finding patterns in number sequences', 'amc8-num-patterns', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(158, 16, 'LCM & GCD Applications', 'Word problems using LCM and GCD', 'amc8-lcm-gcd-app', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions'),
(159, 16, 'Remainder Problems', 'Problems involving remainders', 'amc8-remainders', 'https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions');

-- Additional Prerequisites for new nodes
INSERT INTO node_prerequisite (prerequisite_node_id, dependent_node_id) VALUES
-- Algebra prerequisites
(103, 120), -- Fractions -> Percentages
(104, 121), -- Ratios -> Rate Problems
(120, 122), -- Percentages -> Percent Change
(105, 124), -- Linear Equations -> Systems
(105, 125), -- Linear Equations -> Inequalities
(127, 128), -- Exponents -> Square Roots
(101, 129), -- Arithmetic -> Arithmetic Sequences
(129, 130), -- Arithmetic Sequences -> Geometric Sequences
-- Geometry prerequisites
(107, 132), -- Basic Shapes -> Special Triangles
(107, 133), -- Basic Shapes -> Quadrilaterals
(108, 135), -- Area/Perimeter -> Similarity
(110, 137), -- Pythagorean -> Advanced Circles
(111, 138), -- Circles -> Sectors
(108, 140), -- Area -> Volume
(140, 141), -- Volume -> Surface Area
-- Counting prerequisites
(112, 144), -- Basic Counting -> Casework
(112, 145), -- Basic Counting -> Complementary
(113, 148), -- Permutations -> Inclusion-Exclusion
-- Probability prerequisites
(115, 149), -- Basic Probability -> Conditional
(108, 150), -- Area -> Geometric Probability
(115, 151), -- Basic Probability -> Expected Value
-- Number Theory prerequisites
(116, 153), -- Divisibility -> Modular Arithmetic
(117, 154), -- Factors -> Digit Properties
(119, 158), -- GCD/LCM -> Applications
(116, 159); -- Divisibility -> Remainders

-- Add all new nodes to AMC8 path
INSERT INTO path_node (path_id, node_id, sequence_order) VALUES
-- Algebra additions (starting at order 20)
(2, 120, 20), (2, 121, 21), (2, 122, 22), (2, 123, 23),
(2, 124, 24), (2, 125, 25), (2, 126, 26), (2, 127, 27),
(2, 128, 28), (2, 129, 29), (2, 130, 30), (2, 131, 31),
-- Geometry additions (starting at order 32)
(2, 132, 32), (2, 133, 33), (2, 134, 34), (2, 135, 35),
(2, 136, 36), (2, 137, 37), (2, 138, 38), (2, 139, 39),
(2, 140, 40), (2, 141, 41), (2, 142, 42), (2, 143, 43),
-- Counting & Probability additions (starting at order 44)
(2, 144, 44), (2, 145, 45), (2, 146, 46), (2, 147, 47),
(2, 148, 48), (2, 149, 49), (2, 150, 50), (2, 151, 51),
(2, 152, 52),
-- Number Theory additions (starting at order 53)
(2, 153, 53), (2, 154, 54), (2, 155, 55), (2, 156, 56),
(2, 157, 57), (2, 158, 58), (2, 159, 59);

-- Update sequences
SELECT setval('node_id_seq', 200);
