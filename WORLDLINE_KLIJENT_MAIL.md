# Follow-up mail klijentu — Worldline

Kopiraj i prilagodi po potrebi. Naslov predloška: **Worldline — dodatne informacije za online plaćanje**

---

Poštovani,

Hvala na suradnji oko pokretanja Worldline računa. U međuvremenu sam na web stranici dovršila tehničku integraciju za online kartično plaćanje — nakon što dobijemo testne podatke, potrebno je samo povezivanje i provjera.

Kako bi proces išao što brže, molim Vas da mi uz ranije navedene podatke (Merchant ID, API ključevi i webhook ključevi) javite i sljedeće:

**1. Pristup Merchant Portalu**  
Idealno je da jedna osoba s naše strane (ili Vi) ima pristup portalu tijekom testiranja — posebno za postavljanje webhooka i provjeru aktivnih načina plaćanja.

**2. Aktivacija kartica**  
Molim potvrdite da su u testnom, a kasnije i produkcijskom okruženju aktivirani prihvat **Visa** i **Mastercard** u **EUR** valuti.

**3. Webhook (obavijesti o plaćanjima)**  
Nakon što dobijete pristup portalu, treba registrirati adresu:

`https://ginko-sobe.com/api/webhooks/worldline`

Webhook secret vrijedi samo kratko nakon generiranja — molim da ga odmah spremite i pošaljete nam zajedno s ostalim podacima.

**4. Testno okruženje (preprod)**  
Molim da eksplicitno zatražite **testno / sandbox** okruženje prije produkcije, kako bismo mogli proći cijeli tok rezervacije i plaćanja bez stvarnog terećenja kartice.

**5. Kontakt osoba kod Worldlinea**  
Ako imate kontakt account managera ili tehničke podrške, podijelite ga s nama — ubrzava rješavanje ako nešto zapne na njihovoj strani.

---

**Podsjetnik — što nam treba za testiranje:**

- Merchant ID (PSPID)  
- API Key ID  
- API Secret  
- Webhook Key ID  
- Webhook Secret  

Nakon uspješnog testiranja prelazimo na produkcijske (live) podatke i omogućavamo stvarna online plaćanja gostima.

Ako imate pitanja ili trebate pomoć pri postavljanju u portalu, slobodno se javite.

Srdačan pozdrav,  
Danijela
