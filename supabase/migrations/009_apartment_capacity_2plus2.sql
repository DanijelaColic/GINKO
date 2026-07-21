-- Apartman + Wellness: kapacitet 2+2 (bračni + kauč + pomoćni ležaj)
update rooms
set
  capacity = 4,
  beds = 'Spavaća soba 1: 1 bračni krevet
Dnevni boravak: 1 kauč na rasklapanje
Dodatno: 1 krevet za 1 osobu (pomoćni ležaj)'
where slug in ('ginko-spa-1', 'ginko-spa-2');
