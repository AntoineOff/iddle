// Research.js - Module de recherche et développement
class ResearchModule {
    constructor(engine) {
        this.engine = engine;
        this.researchPoints = 0;
        this.researchPerSecond = 0;
        this.researchers = 0;
        this.researcherCost = 2000;
        this.researcherCostMultiplier = 1.45;
        
        this.technologies = {
            advanced_chassis: {
                name: "Châssis avancé",
                cost: 10,
                level: 0,
                maxLevel: 5,
                effect: "Améliore l'efficacité de production des châssis de 15% par niveau",
                unlocked: true,
                category: "production",
                requires: []
            },
            efficient_engines: {
                name: "Moteurs efficaces",
                cost: 15,
                level: 0,
                maxLevel: 5,
                effect: "Améliore l'efficacité de production des moteurs de 15% par niveau",
                unlocked: true,
                category: "production",
                requires: []
            },
            lean_manufacturing: {
                name: "Production allégée",
                cost: 25,
                level: 0,
                maxLevel: 3,
                effect: "Réduit le coût de production global de 10% par niveau",
                unlocked: true,
                category: "management",
                requires: []
            },
            robotic_assembly: {
                name: "Assemblage robotisé",
                cost: 50,
                level: 0,
                maxLevel: 5,
                effect: "Augmente l'efficacité de la chaîne de montage de 20% par niveau",
                unlocked: true,
                category: "automation",
                requires: []
            },
            hybrid_engines: {
                name: "Moteurs hybrides",
                cost: 40,
                level: 0,
                maxLevel: 3,
                effect: "Débloque la production de moteurs hybrides plus rentables",
                unlocked: false,
                category: "product",
                requires: ["efficient_engines"]
            },
            electric_powertrains: {
                name: "Motorisations électriques",
                cost: 100,
                level: 0,
                maxLevel: 3,
                effect: "Débloque la production de voitures électriques",
                unlocked: false,
                category: "product",
                requires: ["hybrid_engines"]
            },
            ai_quality_control: {
                name: "Contrôle qualité par IA",
                cost: 75,
                level: 0,
                maxLevel: 4,
                effect: "Augmente la probabilité de produire des voitures premium de 5% par niveau",
                unlocked: false,
                category: "automation",
                requires: ["robotic_assembly"]
            },
            green_manufacturing: {
                name: "Production écologique",
                cost: 60,
                level: 0,
                maxLevel: 3,
                effect: "Réduit les coûts de production de 5% et augmente la réputation de 10% par niveau",
                unlocked: false,
                category: "management",
                requires: ["lean_manufacturing"]
            },
            advanced_materials: {
                name: "Matériaux avancés",
                cost: 80,
                level: 0,
                maxLevel: 4,
                effect: "Améliore la qualité des voitures et réduit le poids de 5% par niveau",
                unlocked: false,
                category: "product",
                requires: ["advanced_chassis"]
            },
            smart_factory: {
                name: "Usine intelligente",
                cost: 200,
                level: 0,
                maxLevel: 1,
                effect: "Débloque l'automatisation complète de l'usine",
                unlocked: false,
                category: "automation",
                requires: ["ai_quality_control", "robotic_assembly"]
            }
        };
        
        // Catégories de recherche pour l'UI
        this.categories = {
            production: "Production",
            product: "Produit",
            automation: "Automatisation",
            management: "Gestion"
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateTechTree();
        this.updateUI();
    }
    
    save() {
        return {
            researchPoints: this.researchPoints,
            researchPerSecond: this.researchPerSecond,
            researchers: this.researchers,
            researcherCost: this.researcherCost,
            technologies: this.technologies
        };
    }
    
    load(data) {
        if (!data) return;
        
        this.researchPoints = data.researchPoints || 0;
        this.researchPerSecond = data.researchPerSecond || 0;
        this.researchers = data.researchers || 0;
        this.researcherCost = data.researcherCost || 2000;
        
        // Charger les technologies en préservant la structure
        if (data.technologies) {
            for (const techId in data.technologies) {
                if (this.technologies[techId]) {
                    // Ne mettre à jour que les propriétés qui peuvent changer
                    this.technologies[techId].level = data.technologies[techId].level;
                    this.technologies[techId].unlocked = data.technologies[techId].unlocked;
                }
            }
        }
        
        this.updateTechTree();
        this.updateUI();
    }
    
    update(deltaTime) {
        // Génération passive de points de recherche
        const pointsGenerated = this.researchPerSecond * deltaTime;
        this.researchPoints += pointsGenerated;
        
        // Mise à jour de l'interface utilisateur
        document.getElementById('research-points').textContent = this.engine.formatNumber(this.researchPoints);
    }
    
    hireResearcher() {
        const cost = Math.floor(this.researcherCost * Math.pow(this.researcherCostMultiplier, this.researchers));
        
        if (this.engine.spendMoney(cost)) {
            this.researchers++;
            this.researchPerSecond = this.researchers * 0.1; // Chaque chercheur génère 0.1 point de recherche par seconde
            
            this.engine.showNotification(`Chercheur embauché! Points de recherche: +${this.researchPerSecond.toFixed(1)}/s`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    researchTechnology(techId) {
        const tech = this.technologies[techId];
        
        if (!tech || tech.level >= tech.maxLevel || !tech.unlocked) {
            return false;
        }
        
        const costMultiplier = tech.level + 1;
        const actualCost = tech.cost * costMultiplier;
        
        if (this.researchPoints >= actualCost) {
            this.researchPoints -= actualCost;
            tech.level++;
            
            // Appliquer les effets de la technologie
            this.applyTechnologyEffects(techId);
            
            // Mettre à jour l'arbre technologique
            this.updateTechTree();
            
            this.engine.showNotification(`Technologie "${tech.name}" recherchée au niveau ${tech.level}!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification(`Points de recherche insuffisants! (${this.engine.formatNumber(this.researchPoints)}/${this.engine.formatNumber(actualCost)})`, 'error');
            return false;
        }
    }
    
    applyTechnologyEffects(techId) {
        const tech = this.technologies[techId];
        const productionModule = this.engine.modules.production;
        
        switch (techId) {
            case 'advanced_chassis':
                if (productionModule) {
                    const chassisStep = productionModule.productionSteps.chassis;
                    chassisStep.speed += 0.15; // +15% d'efficacité par niveau
                }
                break;
                
            case 'efficient_engines':
                if (productionModule) {
                    const engineStep = productionModule.productionSteps.engine;
                    engineStep.speed += 0.15; // +15% d'efficacité par niveau
                }
                break;
                
            case 'lean_manufacturing':
                // Réduire les coûts de production de 10%
                if (productionModule) {
                    Object.keys(productionModule.carTypes).forEach(type => {
                        const carType = productionModule.carTypes[type];
                        carType.materialCost *= 0.9; // -10% de coût par niveau
                    });
                }
                break;
                
            case 'robotic_assembly':
                if (productionModule) {
                    productionModule.assemblyLine.efficiency += 0.2; // +20% d'efficacité par niveau
                }
                break;
                
            case 'hybrid_engines':
                // Débloquer les moteurs hybrides au niveau 1
                if (tech.level === 1 && productionModule) {
                    // Réduire les points de recherche nécessaires pour les voitures électriques
                    const electricCar = productionModule.carTypes.electric;
                    if (electricCar) {
                        electricCar.researchRequired = Math.max(50, electricCar.researchRequired - 20);
                    }
                }
                break;
                
            case 'electric_powertrains':
                // Débloquer les voitures électriques au niveau 1
                if (tech.level === 1 && productionModule) {
                    const electricCar = productionModule.carTypes.electric;
                    if (electricCar) {
                        electricCar.researchRequired = Math.max(0, electricCar.researchRequired - 30);
                    }
                }
                break;
                
            case 'ai_quality_control':
                // Augmenter la probabilité de voitures premium
                // Cette fonctionnalité sera implémentée avec le module de marché
                break;
                
            case 'green_manufacturing':
                // Réduire les coûts et augmenter la réputation
                if (productionModule) {
                    Object.keys(productionModule.carTypes).forEach(type => {
                        const carType = productionModule.carTypes[type];
                        carType.materialCost *= 0.95; // -5% de coût par niveau
                    });
                }
                // Augmenter la réputation (sera implémenté avec le module de marché)
                break;
                
            case 'advanced_materials':
                // Améliorer la qualité et réduire le poids
                if (productionModule) {
                    Object.keys(productionModule.carTypes).forEach(type => {
                        // Augmenter le prix de base de 5% par niveau pour représenter la meilleure qualité
                        const carType = productionModule.carTypes[type];
                        carType.basePrice *= 1.05;
                    });
                }
                break;
                
            case 'smart_factory':
                // Automatiser complètement l'usine au niveau 1
                if (tech.level === 1 && productionModule) {
                    // Automatiser toutes les étapes non automatisées
                    Object.keys(productionModule.productionSteps).forEach(step => {
                        const stepData = productionModule.productionSteps[step];
                        if (!stepData.automated) {
                            stepData.automated = true;
                        }
                    });
                    this.engine.showNotification("Usine intelligente débloquée! Toutes les étapes sont automatisées!");
                }
                break;
        }
    }
    
    updateTechTree() {
        // Mettre à jour le statut de déverrouillage des technologies
        for (const techId in this.technologies) {
            const tech = this.technologies[techId];
            
            // Vérifier si toutes les technologies requises sont au niveau minimum requis
            let allRequirementsMet = true;
            for (const requiredTechId of tech.requires) {
                const requiredTech = this.technologies[requiredTechId];
                if (!requiredTech || requiredTech.level === 0) {
                    allRequirementsMet = false;
                    break;
                }
            }
            
            // Déverrouiller la technologie si toutes les conditions sont remplies
            if (allRequirementsMet && !tech.unlocked && tech.requires.length > 0) {
                tech.unlocked = true;
                this.engine.showNotification(`Nouvelle technologie débloquée: ${tech.name}!`);
            }
        }
    }
    
    getResearchPoints() {
        return this.researchPoints;
    }
    
    spendResearchPoints(amount) {
        if (this.researchPoints >= amount) {
            this.researchPoints -= amount;
            return true;
        }
        return false;
    }
    
    processOfflineTime(seconds) {
        // Calculer les points de recherche générés pendant l'absence
        const pointsGenerated = this.researchPerSecond * seconds;
        this.researchPoints += pointsGenerated;
        
        if (pointsGenerated > 0) {
            this.engine.showNotification(`Généré ${this.engine.formatNumber(pointsGenerated)} points de recherche pendant votre absence!`);
        }
    }
    
    reset() {
        this.researchPoints = 0;
        this.researchPerSecond = 0;
        this.researchers = 0;
        this.researcherCost = 2000;
        
        // Réinitialiser toutes les technologies
        for (const techId in this.technologies) {
            const tech = this.technologies[techId];
            tech.level = 0;
            tech.unlocked = tech.requires.length === 0; // Déverrouiller uniquement les technologies de base
        }
        
        this.updateTechTree();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Bouton pour embaucher un chercheur
        document.getElementById('hire-researcher').addEventListener('click', () => {
            this.hireResearcher();
        });
        
        // Boutons de recherche
        document.querySelectorAll('.research-button').forEach(button => {
            const techId = button.getAttribute('data-tech');
            button.addEventListener('click', () => {
                this.researchTechnology(techId);
            });
        });
    }
    
    updateUI() {
        // Mettre à jour les points de recherche
        document.getElementById('research-points').textContent = this.engine.formatNumber(this.researchPoints);
        document.getElementById('research-per-second').textContent = this.researchPerSecond.toFixed(1);
        document.getElementById('researchers-count').textContent = this.researchers;
        
        // Coût du prochain chercheur
        const nextResearcherCost = Math.floor(this.researcherCost * Math.pow(this.researcherCostMultiplier, this.researchers));
        document.getElementById('researcher-cost').textContent = this.engine.formatNumber(nextResearcherCost);
        
        // Mise à jour des technologies
        for (const techId in this.technologies) {
            const tech = this.technologies[techId];
            const techElement = document.querySelector(`.technology[data-tech="${techId}"]`);
            
            if (techElement) {
                // Mettre à jour le niveau
                const levelElement = techElement.querySelector('.tech-level');
                if (levelElement) {
                    levelElement.textContent = `${tech.level}/${tech.maxLevel}`;
                }
                
                // Mettre à jour le coût
                const costElement = techElement.querySelector('.tech-cost');
                if (costElement) {
                    const costMultiplier = tech.level + 1;
                    const actualCost = tech.cost * costMultiplier;
                    costElement.textContent = this.engine.formatNumber(actualCost);
                }
                
                // Afficher/masquer selon le déblocage
                techElement.style.display = tech.unlocked ? 'block' : 'none';
                
                // Désactiver le bouton si le niveau max est atteint
                const researchButton = techElement.querySelector('.research-button');
                if (researchButton) {
                    researchButton.disabled = tech.level >= tech.maxLevel;
                    if (tech.level >= tech.maxLevel) {
                        researchButton.textContent = 'Max';
                    }
                }
            }
        }
    }
}

// Enregistrer le module auprès du moteur de jeu
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine.registerModule('research', new ResearchModule(window.gameEngine));
});