PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO settings (id,shop_name,barcode_prefix,barcode_sequence,receipt_footer,low_stock_default) VALUES (1,'Papeterie Démo','MKT',20,'Merci pour votre visite',5);
INSERT OR IGNORE INTO categories (id,name,description,active,created_at) VALUES
 ('cat-cahiers','Cahiers','Cahiers scolaires',1,unixepoch()),('cat-ecriture','Écriture','Stylos et crayons',1,unixepoch()),
 ('cat-papier','Papier','Papier et enveloppes',1,unixepoch()),('cat-bureau','Bureau','Fournitures de bureau',1,unixepoch()),('cat-services','Services','Impression et finition',1,unixepoch());
INSERT OR IGNORE INTO suppliers (id,name,contact_name,phone,debt_cents,created_at,updated_at) VALUES
 ('sup-1','Atlas Papeterie','Service commercial','0522000001',0,unixepoch(),unixepoch()),
 ('sup-2','Casa Fournitures','Service commercial','0522000002',0,unixepoch(),unixepoch());
INSERT OR IGNORE INTO products (id,category_id,supplier_id,name,sku,product_type,manufacturer_barcode,internal_barcode,internal_qr,purchase_price_cents,selling_price_cents,stock,minimum_stock,unit,active,favourite,created_at,updated_at) VALUES
 ('prd-001','cat-cahiers','sup-1','Cahier 100 pages','CAH-100','physical',NULL,'MKT-000001','PRD:prd-001',350,600,40,8,'unité',1,1,unixepoch(),unixepoch()),
 ('prd-002','cat-cahiers','sup-1','Cahier 200 pages','CAH-200','physical',NULL,'MKT-000002','PRD:prd-002',600,1000,25,6,'unité',1,1,unixepoch(),unixepoch()),
 ('prd-003','cat-ecriture','sup-1','Stylo bleu','STY-BLEU','physical','6110000000011','MKT-000003','PRD:prd-003',120,300,100,20,'unité',1,1,unixepoch(),unixepoch()),
 ('prd-004','cat-ecriture','sup-1','Stylo noir','STY-NOIR','physical','6110000000028','MKT-000004','PRD:prd-004',120,300,90,20,'unité',1,1,unixepoch(),unixepoch()),
 ('prd-005','cat-ecriture','sup-1','Crayon HB','CR-HB','physical',NULL,'MKT-000005','PRD:prd-005',80,200,55,10,'unité',1,0,unixepoch(),unixepoch()),
 ('prd-006','cat-ecriture','sup-1','Gomme blanche','GOM-B','physical',NULL,'MKT-000006','PRD:prd-006',100,250,4,8,'unité',1,0,unixepoch(),unixepoch()),
 ('prd-007','cat-papier','sup-2','Ramette papier A4 80g','A4-80','physical','6110000000035','MKT-000007','PRD:prd-007',4200,5500,12,5,'ramette',1,1,unixepoch(),unixepoch()),
 ('prd-008','cat-bureau','sup-2','Classeur A4','CLA-A4','physical',NULL,'MKT-000008','PRD:prd-008',1800,2800,8,3,'unité',1,0,unixepoch(),unixepoch()),
 ('prd-009','cat-bureau','sup-2','Agrafeuse moyenne','AGR-M','physical',NULL,'MKT-000009','PRD:prd-009',2500,3900,3,4,'unité',1,0,unixepoch(),unixepoch()),
 ('prd-010','cat-bureau','sup-2','Colle stick','COL-ST','physical',NULL,'MKT-000010','PRD:prd-010',500,900,18,5,'unité',1,0,unixepoch(),unixepoch()),
 ('prd-011','cat-services',NULL,'Photocopie A4 N/B','SRV-PH-NB','service',NULL,'MKT-000011','PRD:prd-011',0,50,0,0,'page',1,1,unixepoch(),unixepoch()),
 ('prd-012','cat-services',NULL,'Impression A4 couleur','SRV-IMP-C','service',NULL,'MKT-000012','PRD:prd-012',0,300,0,0,'page',1,1,unixepoch(),unixepoch()),
 ('prd-013','cat-services',NULL,'Plastification A4','SRV-PLA-A4','service',NULL,'MKT-000013','PRD:prd-013',0,1000,0,0,'unité',1,1,unixepoch(),unixepoch()),
 ('prd-014','cat-papier','sup-2','Enveloppe blanche','ENV-B','physical',NULL,'MKT-000014','PRD:prd-014',30,100,200,30,'unité',1,0,unixepoch(),unixepoch()),
 ('prd-015','cat-bureau','sup-2','Calculatrice scolaire','CAL-SCO','physical',NULL,'MKT-000015','PRD:prd-015',4500,6500,0,3,'unité',1,0,unixepoch(),unixepoch());
