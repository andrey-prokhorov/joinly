  // hanera databsen                                                                                 
  import Database, { Database as DatabaseType } from 'better-sqlite3';                               
  import bcrypt from 'bcryptjs';      
  import path from 'path';                                                                           
  import { fileURLToPath } from 'url';      
  
                                                                                                     
  // ES modules: skapa __dirname manuellt                                                            
  const __filename = fileURLToPath(import.meta.url);                                                 
  const __dirname = path.dirname(__filename);                                                        
                                                                                                     
  // databasfilen:                                                                                   
  const dbPath = path.join(__dirname, '../../data/joinly.db');                                       
                                                                                                     
  // skapa en databasanslutning                                                                      
  const db: DatabaseType = new Database(dbPath);    
  
  
  // aktivera foreign key-stöd                                                                       
  db.pragma('foreign_keys = ON');                                                                    
  
  // Skapa users-tabell                                                                              
  db.exec(`                                                                                          
    CREATE TABLE IF NOT EXISTS users (                                                               
      id INTEGER PRIMARY KEY AUTOINCREMENT,                                                          
      email TEXT UNIQUE NOT NULL,                                                                    
      password_hash TEXT NOT NULL,                                                                   
      name TEXT,                                                                                     
      role TEXT DEFAULT 'user',                                                                      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP                                                  
      )                                                                                                
      `);                                                                                                
      
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };      
  if (userCount.count === 0) {                                                                      
  // Hasha lösenordet (synkront för enkel setup)                                                  
  const testPassword = 'Test123!';  // Uppfyller: 8+ tecken, stor, liten, siffra, special         
  const hashedPassword = bcrypt.hashSync(testPassword, 10);                                       
                                                                                                  
  // Lägg till testanvändare                                                                      
  db.prepare(`                                                                                    
    INSERT INTO users (email, password_hash, name, role)                                          
    VALUES (?, ?, ?, ?)                                                                           
  `).run('test@example.com', hashedPassword, 'Test User', 'user');                                
                                                                                                  
  console.log('Seed: Testanvändare skapad (test@example.com / Test123!)');                        
}  
  
  
      // Logga att databasen är redo                                                                     
  console.log('Database initialized:', dbPath);                                                      
                                                                                                     
  export default db;    