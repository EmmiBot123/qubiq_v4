const TEMPLATES = [
  {
    id: "hello_world",
    name: "Hello World",
    icon: "👋",
    code: `# Hello, World!
# Your first Python program

name = input("What is your name? ")
print(f"Hello, {name}! Welcome to Python!")
`
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: "🧮",
    code: `# Simple Calculator
# Perform basic arithmetic operations

def add(a, b):      return a + b
def subtract(a, b): return a - b
def multiply(a, b): return a * b
def divide(a, b):   return a / b if b != 0 else "Error: Division by zero"

print("=== Simple Calculator ===")
a = float(input("Enter first number: "))
op = input("Enter operator (+, -, *, /): ")
b = float(input("Enter second number: "))

if op == '+':   result = add(a, b)
elif op == '-': result = subtract(a, b)
elif op == '*': result = multiply(a, b)
elif op == '/': result = divide(a, b)
else:           result = "Invalid operator"

print(f"Result: {a} {op} {b} = {result}")
`
  },
  {
    id: "loops",
    name: "Loops & Ranges",
    icon: "🔄",
    code: `# Loops in Python
# for loops, while loops, range()

print("=== For Loop ===")
for i in range(1, 6):
    print(f"  Count: {i}")

print()
print("=== While Loop ===")
n = 10
while n > 0:
    print(f"  Countdown: {n}")
    n -= 2

print()
print("=== Loop with List ===")
fruits = ["apple", "banana", "cherry", "mango"]
for index, fruit in enumerate(fruits):
    print(f"  {index + 1}. {fruit}")
`
  },
  {
    id: "functions",
    name: "Functions",
    icon: "⚙️",
    code: `# Functions in Python
# Define, call, and understand functions

def greet(name, greeting="Hello"):
    """A simple greeting function."""
    return f"{greeting}, {name}!"

def factorial(n):
    """Calculate factorial recursively."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def is_prime(num):
    """Check if a number is prime."""
    if num < 2:
        return False
    for i in range(2, int(num ** 0.5) + 1):
        if num % i == 0:
            return False
    return True

# Test the functions
print(greet("Student"))
print(greet("Python", greeting="Welcome to"))
print()
print(f"5! = {factorial(5)}")
print(f"10! = {factorial(10)}")
print()
primes = [n for n in range(2, 30) if is_prime(n)]
print(f"Primes up to 30: {primes}")
`
  },
  {
    id: "lists_dicts",
    name: "Lists & Dicts",
    icon: "📦",
    code: `# Lists and Dictionaries in Python

# --- Lists ---
print("=== Lists ===")
scores = [85, 92, 78, 95, 88]
scores.append(91)
print(f"Scores: {scores}")
print(f"Average: {sum(scores) / len(scores):.1f}")
print(f"Highest: {max(scores)}, Lowest: {min(scores)}")
print(f"Sorted:  {sorted(scores, reverse=True)}")

print()

# --- Dictionaries ---
print("=== Dictionary ===")
student = {
    "name": "Alex",
    "grade": 10,
    "subjects": ["Math", "Science", "English"],
    "gpa": 3.8
}

for key, value in student.items():
    print(f"  {key}: {value}")

# Update & add
student["gpa"] = 3.9
student["club"] = "Coding Club"
print(f"\nUpdated GPA: {student['gpa']}")
print(f"Student in club: {student['club']}")
`
  },
  {
    id: "classes",
    name: "Classes & OOP",
    icon: "🏗️",
    code: `# Object-Oriented Programming in Python

class Animal:
    def __init__(self, name, species):
        self.name = name
        self.species = species

    def speak(self):
        return f"{self.name} makes a sound."

    def __str__(self):
        return f"{self.name} ({self.species})"


class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name, "Canis lupus familiaris")
        self.breed = breed

    def speak(self):
        return f"{self.name} says: Woof! 🐶"

    def fetch(self, item):
        return f"{self.name} fetched the {item}!"


class Cat(Animal):
    def speak(self):
        return f"{self.name} says: Meow! 🐱"


# Create objects
dog = Dog("Buddy", "Labrador")
cat = Cat("Whiskers", "Felis catus")

print(dog)
print(dog.speak())
print(dog.fetch("ball"))
print()
print(cat)
print(cat.speak())
`
  },
  {
    id: "file_sim",
    name: "File I/O (Simulated)",
    icon: "📄",
    code: `# File I/O in Python (simulated with StringIO)
# Pyodide supports real file operations too!

import io

# Simulate writing to a file
print("=== Writing to a file ===")
content = """Name,Age,Grade
Alice,15,A
Bob,16,B+
Charlie,15,A-
Diana,17,A+
"""

# Write
file_buffer = io.StringIO(content)
print("File written successfully!")

# Read it back
print()
print("=== Reading the file ===")
file_buffer.seek(0)
lines = file_buffer.readlines()
print(f"Total lines: {len(lines)}")

# Parse CSV manually
print()
print("=== Parsed Data ===")
header = lines[0].strip().split(',')
print(f"Headers: {header}")
for line in lines[1:]:
    values = line.strip().split(',')
    if values:
        record = dict(zip(header, values))
        print(f"  {record}")
`
  },
  {
    id: "error_handling",
    name: "Error Handling",
    icon: "🛡️",
    code: `# Error Handling in Python
# try, except, finally, raise

def safe_divide(a, b):
    try:
        result = a / b
        return result
    except ZeroDivisionError:
        print(f"  ⚠️  Cannot divide {a} by zero!")
        return None
    except TypeError as e:
        print(f"  ⚠️  Type error: {e}")
        return None

def get_list_item(lst, index):
    try:
        return lst[index]
    except IndexError:
        print(f"  ⚠️  Index {index} is out of range (list has {len(lst)} items)")
        return None

print("=== Division ===")
print(f"10 / 2 = {safe_divide(10, 2)}")
safe_divide(5, 0)

print()
print("=== List Access ===")
colors = ["red", "green", "blue"]
print(f"Index 1: {get_list_item(colors, 1)}")
get_list_item(colors, 10)

print()
print("=== Custom Exception ===")
class AgeError(Exception):
    pass

def register_student(age):
    if not isinstance(age, int):
        raise TypeError("Age must be an integer")
    if age < 5 or age > 25:
        raise AgeError(f"Age {age} is not valid for registration")
    print(f"  ✅ Student registered with age {age}")

for age in [12, 3, 30, "sixteen"]:
    try:
        register_student(age)
    except AgeError as e:
        print(f"  ❌ AgeError: {e}")
    except TypeError as e:
        print(f"  ❌ TypeError: {e}")
`
  }
];
