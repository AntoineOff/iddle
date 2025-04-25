// Production.js - Gestion de la production des voitures
class ProductionModule {
    constructor(engine) {
        this.engine = engine;
        this.productionSteps = {
            chassis: { 
                level: 1, 
                speed: 1, 
                cost: 500, 
                automated: false, 
                progress: 0,
                baseTime: 5, // temps en secondes pour compléter un châssis
                upgradeMultiplier: 1.5 // facteur d'augmentation du coût à chaque amélioration
            },
            engine: { 
                level: 1, 
                speed: 1, 
                cost: 750, 
                automated: false, 
                progress: 0,
                baseTime: 8,
                upgradeMultiplier: 1.6
            },
            body: { 
                level: 1, 
                speed: 1, 
                cost: 600, 
                automated: false, 
                progress: 0,
                baseTime: 6,
                upgradeMultiplier: 1.5
            },
            paint: { 
                level: 1, 
                speed: 1, 
                cost: 400, 
                automated: false, 
                progress: 0,
                baseTime: 4,
                upgradeMultiplier: 1.4
            },
            interior: { 
                level: 1, 
                speed: 1, 
                cost: 800, 
                automated: false, 
                progress: 0,
                baseTime: 7,
                upgradeMultiplier: 1.65
            },
            testing: { 
                level: 1, 
                speed: 1, 
                cost: 300, 
                automated: false, 
                progress: 0,
                baseTime: 3,
                upgradeMultiplier: 1.3
            },
            delivery: { 
                level: 1, 
                speed: 1, 
                cost: 450, 
                automated: false, 
                progress: 0,
                baseTime: 4,
                upgradeMultiplier: 1.45
            }
        };
        
        this.carTypes = {
            compact: {
                unlocked: true,
                cost: 2000,
                basePrice: 8000,
                productionTime: 1.0, // multiplicateur de temps
                materialCost: 0.8, // multiplicateur de coût des matériaux
                researchRequired: 0
            },
            sedan: {
                unlocked: false,
                cost: 3500,
                basePrice: 12000,
                productionTime: 1.2,
                materialCost: 1.0,
                researchRequired: 10
            },
            suv: {
                unlocked: false,
                cost: 5000,
                basePrice: 18000,
                productionTime: 1.5,
                materialCost: 1.3,
                researchRequired: 25
            },
            pickup: {
                unlocked: false,
                cost: 4500,
                basePrice: 16000,
                productionTime: 1.4,
                materialCost: 1.2,
                researchRequired: 20
            },
            sports: {
                unlocked: false,
                cost: 8000,
                basePrice: 30000,
                productionTime: 1.8,
                materialCost: 1.6,
                researchRequired: 50
            },
            electric: {
                unlocked: false,
                cost: 12000,
                basePrice: 40000,
                productionTime: 2.0,
                materialCost: 1.8,
                researchRequired: 100
            }
        };
        
        this.currentCarType = 'compact'; // Type de voiture actuellement en production
        this.activeSteps = []; // Étapes actuellement en cours de production
        this.completedComponents = {
            chassis: 0,
            engine: 0,
            body: 0,
            paint: 0,
            interior: 0,
            testing: 0,
            delivery: 0
        };
        
        this.assemblyLine = {
            level: 1,
            efficiency: 1,
            cost: 5000,
            upgradeMultiplier: 2.0
        };
        
        this.init();
    }
    
    init() {
        // Configurer les événements de l'interface utilisateur
        this.setupEventListeners();
        
        // Initialiser l'UI
        this.updateUI();
    }
    
    save() {
        return {
            productionSteps: this.productionSteps,
            carTypes: this.carTypes,
            currentCarType: this.currentCarType,
            completedComponents: this.completedComponents,
            assemblyLine: this.assemblyLine
        };
    }
    
    load(data) {
        if (!data) return;
        
        this.productionSteps = data.productionSteps || this.productionSteps;
        this.carTypes = data.carTypes || this.carTypes;
        this.currentCarType = data.currentCarType || 'compact';
        this.completedComponents = data.completedComponents || this.completedComponents;
        this.assemblyLine = data.assemblyLine || this.assemblyLine;
    }
    
    update(deltaTime) {
        // Mise à jour des étapes automatisées
        Object.keys(this.productionSteps).forEach(step => {
            const stepData = this.productionSteps[step];
            
            if (stepData.automated) {
                this.progressStep(step, deltaTime);
            }
        });
        
        // Vérifier l'assemblage automatique si la chaîne de montage est améliorée
        if (this.assemblyLine.level > 1) {
            this.checkAutoAssembly();
        }
    }
    
    progressStep(step, deltaTime) {
        const stepData = this.productionSteps[step];
        const carTypeData = this.carTypes[this.currentCarType];
        const timeRequired = stepData.baseTime * carTypeData.productionTime / stepData.speed;
        
        stepData.progress += deltaTime;
        
        // Si l'étape est terminée
        if (stepData.progress >= timeRequired) {
            // Réinitialiser la progression
            stepData.progress = 0;
            
            // Augmenter le nombre de composants terminés
            this.completedComponents[step]++;
            
            // Vérifier si une voiture complète peut être assemblée
            this.checkAssembly();
            
            // Mettre à jour l'interface
            this.updateUI();
        }
    }
    
    checkAssembly() {
        // Vérifier si tous les composants sont disponibles pour assembler une voiture
        const minComponents = Math.min(
            this.completedComponents.chassis,
            this.completedComponents.engine,
            this.completedComponents.body,
            this.completedComponents.paint,
            this.completedComponents.interior,
            this.completedComponents.testing,
            this.completedComponents.delivery
        );
        
        if (minComponents > 0) {
            // Assembler autant de voitures que possible
            this.assembleCars(minComponents);
        }
    }
    
    checkAutoAssembly() {
        // La chaîne de montage automatique essaie d'assembler des voitures à intervalles réguliers
        const autoAssemblyEfficiency = (this.assemblyLine.level - 1) * 0.1; // 10% d'efficacité par niveau
        
        // Probabilité d'assembler une voiture basée sur l'efficacité
        if (Math.random() < autoAssemblyEfficiency) {
            this.checkAssembly();
        }
    }
    
    assembleCars(count) {
        const carType = this.carTypes[this.currentCarType];
        const earnings = carType.basePrice * count;
        
        // Soustraire les composants utilisés
        Object.keys(this.completedComponents).forEach(component => {
            this.completedComponents[component] -= count;
        });
        
        // Ajouter l'argent
        this.engine.addMoney(earnings);
        
        // Mettre à jour les statistiques
        this.engine.gameState.stats.carsProduced += count;
        
        // Notification
        this.engine.showNotification(`${count} ${this.currentCarType} assemblée(s)! +${this.engine.formatNumber(earnings)}$`);
        
        // Mettre à jour l'interface
        this.updateUI();
    }
    
    manuallyProgressStep(step) {
        // Vérifier si l'étape n'est pas automatisée
        if (this.productionSteps[step].automated) {
            return;
        }
        
        // Calculer combien de progression ajouter (clic manuel = progression complète)
        const carTypeData = this.carTypes[this.currentCarType];
        const stepData = this.productionSteps[step];
        const timeRequired = stepData.baseTime * carTypeData.productionTime / stepData.speed;
        
        // Progression complète en un clic
        stepData.progress = timeRequired;
        
        // Finir l'étape
        this.progressStep(step, 0);
    }
    
    upgradeStep(step) {
        const stepData = this.productionSteps[step];
        const upgradeCost = Math.floor(stepData.cost * Math.pow(stepData.upgradeMultiplier, stepData.level - 1));
        
        if (this.engine.spendMoney(upgradeCost)) {
            stepData.level++;
            stepData.speed = 1 + (stepData.level - 1) * 0.2; // +20% de vitesse par niveau
            
            this.engine.gameState.stats.upgradesPurchased++;
            this.engine.showNotification(`${step} amélioré au niveau ${stepData.level}!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    automateStep(step) {
        const stepData = this.productionSteps[step];
        const automationCost = stepData.cost * 5 * stepData.level;
        
        if (this.engine.spendMoney(automationCost)) {
            stepData.automated = true;
            
            this.engine.gameState.stats.upgradesPurchased++;
            this.engine.showNotification(`${step} automatisé!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    upgradeAssemblyLine() {
        const upgradeCost = this.assemblyLine.cost * Math.pow(this.assemblyLine.upgradeMultiplier, this.assemblyLine.level - 1);
        
        if (this.engine.spendMoney(upgradeCost)) {
            this.assemblyLine.level++;
            this.assemblyLine.efficiency = 1 + (this.assemblyLine.level - 1) * 0.15; // +15% d'efficacité par niveau
            
            this.engine.gameState.stats.upgradesPurchased++;
            this.engine.showNotification(`Chaîne de montage améliorée au niveau ${this.assemblyLine.level}!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    changeCarType(type) {
        if (this.carTypes[type] && this.carTypes[type].unlocked) {
            this.currentCarType = type;
            this.engine.showNotification(`Production changée pour: ${type}`);
            this.updateUI();
        } else {
            this.engine.showNotification('Ce type de voiture n\'est pas disponible!', 'error');
        }
    }
    
    unlockCarType(type) {
        const carType = this.carTypes[type];
        
        if (!carType || carType.unlocked) return false;
        
        const researchModule = this.engine.modules.research;
        const researchPoints = researchModule ? researchModule.getResearchPoints() : 0;
        
        if (researchPoints >= carType.researchRequired) {
            if (this.engine.spendMoney(carType.cost * 5)) {
                carType.unlocked = true;
                if (researchModule) {
                    researchModule.spendResearchPoints(carType.researchRequired);
                }
                this.engine.showNotification(`Type de voiture débloqué: ${type}!`);
                this.updateUI();
                return true;
            } else {
                this.engine.showNotification('Fonds insuffisants!', 'error');
            }
        } else {
            this.engine.showNotification(`Recherche insuffisante! (${researchPoints}/${carType.researchRequired})`, 'error');
        }
        return false;
    }
    
    processOfflineTime(seconds) {
        // Pour chaque étape automatisée, calculer combien de composants auraient été produits
        Object.keys(this.productionSteps).forEach(step => {
            const stepData = this.productionSteps[step];
            
            if (stepData.automated) {
                const carTypeData = this.carTypes[this.currentCarType];
                const timePerUnit = stepData.baseTime * carTypeData.productionTime / stepData.speed;
                const unitsProduced = Math.floor(seconds / timePerUnit);
                
                if (unitsProduced > 0) {
                    this.completedComponents[step] += unitsProduced;
                }
            }
        });
        
        // Vérifier l'assemblage
        this.checkAssembly();
    }
    
    reset() {
        // Réinitialiser toutes les données de production
        Object.keys(this.productionSteps).forEach(step => {
            const stepData = this.productionSteps[step];
            stepData.level = 1;
            stepData.speed = 1;
            stepData.automated = false;
            stepData.progress = 0;
        });
        
        Object.keys(this.carTypes).forEach(type => {
            if (type === 'compact') {
                this.carTypes[type].unlocked = true;
            } else {
                this.carTypes[type].unlocked = false;
            }
        });
        
        this.currentCarType = 'compact';
        
        Object.keys(this.completedComponents).forEach(component => {
            this.completedComponents[component] = 0;
        });
        
        this.assemblyLine = {
            level: 1,
            efficiency: 1,
            cost: 5000,
            upgradeMultiplier: 2.0
        };
        
        this.updateUI();
    }
    
    setupEventListeners() {
        // Production manuelle
        document.querySelectorAll('.produce-button').forEach(button => {
            const step = button.getAttribute('data-step');
            button.addEventListener('click', () => {
                this.manuallyProgressStep(step);
            });
        });
        
        // Amélioration
        document.querySelectorAll('.upgrade-button').forEach(button => {
            const step = button.getAttribute('data-step');
            button.addEventListener('click', () => {
                this.upgradeStep(step);
            });
        });
        
        // Automatisation
        document.querySelectorAll('.automate-button').forEach(button => {
            const step = button.getAttribute('data-step');
            button.addEventListener('click', () => {
                this.automateStep(step);
            });
        });
        
        // Amélioration de la chaîne de montage
        document.getElementById('upgrade-assembly').addEventListener('click', () => {
            this.upgradeAssemblyLine();
        });
        
        // Change car type
        document.querySelectorAll('.car-type-button').forEach(button => {
            const type = button.getAttribute('data-type');
            button.addEventListener('click', () => {
                this.changeCarType(type);
            });
        });
        
        // Unlock car type
        document.querySelectorAll('.unlock-car-button').forEach(button => {
            const type = button.getAttribute('data-type');
            button.addEventListener('click', () => {
                this.unlockCarType(type);
            });
        });
    }
    
    updateUI() {
        // Mise à jour des informations de production
        Object.keys(this.productionSteps).forEach(step => {
            const stepData = this.productionSteps[step];
            const carTypeData = this.carTypes[this.currentCarType];
            const timeRequired = stepData.baseTime * carTypeData.productionTime / stepData.speed;
            
            // Progression
            const progressBar = document.querySelector(`.progress-bar[data-step="${step}"]`);
            if (progressBar) {
                progressBar.style.width = `${(stepData.progress / timeRequired) * 100}%`;
            }
            
            // Niveau et automatisation
            const stepLevel = document.querySelector(`.step-level[data-step="${step}"]`);
            if (stepLevel) {
                stepLevel.textContent = `Niveau ${stepData.level} (${stepData.automated ? 'Auto' : 'Manuel'})`;
            }
            
            // Coût d'amélioration
            const upgradeCost = document.querySelector(`.upgrade-cost[data-step="${step}"]`);
            if (upgradeCost) {
                const cost = Math.floor(stepData.cost * Math.pow(stepData.upgradeMultiplier, stepData.level - 1));
                upgradeCost.textContent = `${this.engine.formatNumber(cost)}$`;
            }
            
            // Coût d'automatisation
            const automateCost = document.querySelector(`.automate-cost[data-step="${step}"]`);
            if (automateCost) {
                const cost = stepData.cost * 5 * stepData.level;
                automateCost.textContent = `${this.engine.formatNumber(cost)}$`;
            }
            
            // Cacher/afficher les boutons d'automatisation
            const automateButton = document.querySelector(`.automate-button[data-step="${step}"]`);
            if (automateButton) {
                automateButton.style.display = stepData.automated ? 'none' : 'inline-block';
            }
            
            // Afficher le nombre de composants terminés
            const completedCount = document.querySelector(`.completed-count[data-step="${step}"]`);
            if (completedCount) {
                completedCount.textContent = this.completedComponents[step];
            }
        });
        
        // Mise à jour des informations de chaîne de montage
        const assemblyLevel = document.getElementById('assembly-level');
        if (assemblyLevel) {
            assemblyLevel.textContent = `Niveau ${this.assemblyLine.level}`;
        }
        
        const assemblyEfficiency = document.getElementById('assembly-efficiency');
        if (assemblyEfficiency) {
            assemblyEfficiency.textContent = `${(this.assemblyLine.efficiency * 100).toFixed(0)}%`;
        }
        
        const assemblyUpgradeCost = document.getElementById('assembly-upgrade-cost');
        if (assemblyUpgradeCost) {
            const cost = this.assemblyLine.cost * Math.pow(this.assemblyLine.upgradeMultiplier, this.assemblyLine.level - 1);
            assemblyUpgradeCost.textContent = `${this.engine.formatNumber(cost)}$`;
        }
        
        // Mise à jour des types de voiture
        Object.keys(this.carTypes).forEach(type => {
            const carType = this.carTypes[type];
            
            // Afficher/cacher les boutons selon le déblocage
            const typeButton = document.querySelector(`.car-type-button[data-type="${type}"]`);
            const unlockButton = document.querySelector(`.unlock-car-button[data-type="${type}"]`);
            
            if (typeButton) {
                typeButton.style.display = carType.unlocked ? 'inline-block' : 'none';
                
                // Marquer le type actuellement sélectionné
                if (type === this.currentCarType) {
                    typeButton.classList.add('active');
                } else {
                    typeButton.classList.remove('active');
                }
            }
            
            if (unlockButton) {
                unlockButton.style.display = carType.unlocked ? 'none' : 'inline-block';
                
                const researchRequired = document.querySelector(`.research-required[data-type="${type}"]`);
                if (researchRequired) {
                    researchRequired.textContent = carType.researchRequired;
                }
                
                const unlockCost = document.querySelector(`.unlock-cost[data-type="${type}"]`);
                if (unlockCost) {
                    unlockCost.textContent = this.engine.formatNumber(carType.cost * 5);
                }
            }
        });
    }
}

// Enregistrer le module auprès du moteur de jeu
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine.registerModule('production', new ProductionModule(window.gameEngine));
});