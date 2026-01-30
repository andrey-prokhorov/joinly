  // hanera databsen                                                                                 
  import Database, { Database as DatabaseType } from 'better-sqlite3';                               
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
                                                                                                     
  // Logga att databasen är redo                                                                     
  console.log('Database initialized:', dbPath);                                                      
                                                                                                     
  export default db;    