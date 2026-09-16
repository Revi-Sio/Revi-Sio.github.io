import hashlib

def main():
    while True:
        mot = input("Entre un mot à hacher (ou 'q' pour quitter) : ").strip()
        if mot.lower() == 'q':
            break
            
        sha256_hash = hashlib.sha256(mot.encode('utf-8')).hexdigest()
        print(f"Mot        : {mot}")
        print(f"SHA-256    : {sha256_hash}\n")

if __name__ == "__main__":
    main()