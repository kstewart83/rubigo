import csv

INPUT_FILE = "worldcities.csv"
OUTPUT_FILE = "worldcities_dev.csv"

def is_major_us_city(row):
    if row['iso2'] != 'US':
        return False
    
    try:
        pop = float(row['population']) if row['population'] else 0
    except ValueError:
        pop = 0
        
    is_large = pop >= 300000 # Lowered slightly to capture more relevant hubs if needed, but keeping user 500k in mind, let's stick to 500k or strictly capitals.
    # User said: "Recommend a population level and then bring any cities above that population level as well as all US capitol cities"
    
    # Capital field values: 'primary' (DC), 'admin' (State Capital)
    is_capital = row['capital'] in ['primary', 'admin']
    
    return (pop > 500000) or is_capital

def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f_in, \
         open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f_out:
        
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=reader.fieldnames)
        
        writer.writeheader()
        
        count = 0
        for row in reader:
            if is_major_us_city(row):
                writer.writerow(row)
                count += 1
                
        print(f"Filtered {count} cities to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
