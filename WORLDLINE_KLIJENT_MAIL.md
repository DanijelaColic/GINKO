# Follow-up mail klijentu — Saferpay (Worldline)

Kopiraj i prilagodi. Naslov: **Saferpay — podaci za online plaćanje (test)**

---

Poštovani,

hvala na informaciji da koristite **Saferpay** (Worldline). Tehnička integracija na webu je spremna za povezivanje — trebaju nam samo pristupni podaci iz Saferpay Backofficea.

Linkovi koje ste poslali potvrđuju proizvod; za testiranje trebamo sljedeće korake:

### 1. Test Backoffice račun
Ako još nemate test pristup, registrirajte se ovdje (besplatno):  
https://test.saferpay.com/BO/SignUp?lang=en

Ako vam je Worldline već poslao **Customer ID**, **Terminal ID** i login za Backoffice — pošaljite nam to.

### 2. JSON API kredencijali (obavezno za web shop)
U Saferpay Backofficeu:
1. Prijavite se
2. **Settings → JSON API basic Authentication**
3. **Create new JSON API login**
4. Spremiti **username** i **password** odmah (password se više ne prikazuje)

### 3. Što nam treba (test okruženje)

Molimo pošaljite:

| Podatak | Primjer / gdje |
|--------|----------------|
| **CustomerId** | npr. broj u Backofficeu |
| **TerminalId** | eCommerce terminal (Settings → Terminals) |
| **JSON API username** | iz koraka 2 |
| **JSON API password** | iz koraka 2 |
| Potvrda da su aktivni **Visa** i **Mastercard** u **EUR** | Settings → Terminals |

### 4. Napomena
Ne trebamo „Worldline Direct / PSPID / API Key ID“ — to je drugi proizvod. Za Saferpay vrijede samo gornji podaci.

Nakon što stignu testni podaci, povežemo plaćanje, prođemo rezervaciju → depozit → potvrdu, pa prelazimo na live (produkcijske) kredencijale.

Ako trebate pomoć pri kreiranju JSON API logina u Backofficeu, javite se.

Srdačan pozdrav,  
Danijela
