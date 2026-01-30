import "dotenv/config";
// Konfiguration för Joinly API
export const config = {                                                                    
	server: {                                                                            
	port: Number(process.env.PORT) || 3001,                                      
	nodeEnv: process.env.NODE_ENV || "development",                              
	}, 
	                                                                                 																																										
	jwt: {                                                                               
	secret: process.env.JWT_SECRET || "dev-secret-change-in-production",         
	expiresIn: process.env.JWT_EXPIRES_IN || "24h",                              
	},                                                                                   																																										
	// Hjälpfunktioner                                                                   
	isProduction: () => config.server.nodeEnv === "production",                          
	isDevelopment: () => config.server.nodeEnv === "development",                        
	isTest: () => config.server.nodeEnv === "test",                                      
} as const;                                                                                
																																													
// Säkerhetskoll: varna om default secret i produktion                                     
if (config.isProduction() && config.jwt.secret === "dev-secret-change-in-production") {    
		throw new Error("KRITISKT: JWT_SECRET måste sättas i produktion!");                  
} 

export default config;
