with open(r'c:\G-Antigravity Workspace\QA-Ai-Assistant\app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines):
    open_count = line.count('{')
    close_count = line.count('}')
    balance += open_count - close_count
    if balance < 0:
        print(f"Imbalance detected at line {i+1}: balance is {balance}")
    # Print the line if it seems to start a block that never ends
    if open_count > close_count:
        pass

print(f"Final balance: {balance}")
