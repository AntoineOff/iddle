// Market.js - Gestion du marché, des ventes et de l'exportation
class MarketModule {
    constructor(engine) {
        this.engine = engine;
        this.marketRegions = {
            local: {
                name: "Marché local",
                unlocked: true,
                demandMultiplier: 1.0,
                priceMultiplier: 1.0,
                taxRate: 0.1,
                reputation: 0,
                preferences: {
                    compact: 1.2,
                    sedan: 1.0,
                    suv: 0.9,
                    pickup: 0.8,
                    sports: 0.5,
                    electric: 0.7
                }
            },
            europe: {
                name: "Europe",
                unlocked: false,
                demandMultiplier: 1.2,
                priceMultiplier: 1.1,
                taxRate: 0.15,
                reputation: 0,
                unlockCost: 50000,
                unlockResearch: 25,
                preferences: {
                    compact: 1.5,
                    sedan: 1.2,
                    suv: 0.8,
                    pickup: 0.4,
                    sports: 0.9,
                    electric: 1.4
                }
            },
            northAmerica: {
                name: "Amérique du Nord",
                unlocked: false,
                demandMultiplier: 1.5,
                priceMultiplier: 1.2,
                taxRate: 0.12,
                reputation: 0,
                unlockCost: 100000,
                unlockResearch: 50,
                preferences: {
                    compact: 0.7,
                    sedan: 1.0,
                    suv: 1.4,
                    pickup: 1.8,
                    sports: 1.1,
                    electric: 0.9
                }
            },
            asia: {
                name: "Asie",
                unlocked: false,
                demandMultiplier: 1.8,
                priceMultiplier: 0.9,
                taxRate: 0.18,
                reputation: 0,
                unlockCost: 200000,
                unlockResearch: 75,
                preferences: {
                    compact: 1.6,
                    sedan: 1.3,
                    suv: 1.0,
                    pickup: 0.5,
                    sports: 0.8,
                    electric: 1.2
                }
            },
            luxury: {
                name: "Marché de luxe",
                unlocked: false,
                demandMultiplier: 0.6,
                priceMultiplier: 2.5,
                taxRate: 0.25,
                reputation: 0,
                unlockCost: 500000,
                unlockResearch: 150,
                prestigeRequired: 1,
                preferences: {
                    compact: 0.2,
                    sedan: 0.8,
                    suv: 1.5,
                    pickup: 0.1,
                    sports: 2.0,
                    electric: 1.8
                }
            }
        };
        
        this.specialContracts = [];
        this.activeContracts = [];
        this.maxActiveContracts = 1;
        this.contractGenerationTime = 0;
        this.contractGenerationInterval = 86400; // Un jour en secondes
        
        this.brandValue = 0;
        this.brandLevel = 1;
        this.brandUpgradeCost = 25000;
        this.brandUpgradeMultiplier = 2.5;
        
        this.marketingLevel = 1;
        this.marketingCost = 5000;
        this.marketingCostMultiplier = 1.8;
        this.marketingEffectiveness = 0.05; // 5% de boost de vente par niveau
        
        this.seasons = ["winter", "spring", "summer", "fall"];
        this.currentSeason = 0; // Commencer en hiver
        this.seasonalPreferences = {
            winter: { suv: 1.3, pickup: 1.2, compact: 0.8 },
            spring: { compact: 1.2, sedan: 1.1, electric: 1.2 },
            summer: { sports: 1.4, convertible: 1.3, sedan: 1.1 },
            fall: { suv: 1.1, sedan: 1.0, electric: 1.1 }
        };
        
        this.salesHistory = {
            daily: [],
            weekly: [],
            monthly: []
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateInitialContracts();
        this.updateUI();
    }
    
    save() {
        return {
            marketRegions: this.marketRegions,
            specialContracts: this.specialContracts,
            activeContracts: this.activeContracts,
            maxActiveContracts: this.maxActiveContracts,
            contractGenerationTime: this.contractGenerationTime,
            brandValue: this.brandValue,
            brandLevel: this.brandLevel,
            brandUpgradeCost: this.brandUpgradeCost,
            marketingLevel: this.marketingLevel,
            marketingCost: this.marketingCost,
            currentSeason: this.currentSeason,
            salesHistory: this.salesHistory
        };
    }
    
    load(data) {
        if (!data) return;
        
        // Charger les propriétés simples
        this.maxActiveContracts = data.maxActiveContracts || 1;
        this.contractGenerationTime = data.contractGenerationTime || 0;
        this.brandValue = data.brandValue || 0;
        this.brandLevel = data.brandLevel || 1;
        this.brandUpgradeCost = data.brandUpgradeCost || 25000;
        this.marketingLevel = data.marketingLevel || 1;
        this.marketingCost = data.marketingCost || 5000;
        this.currentSeason = data.currentSeason || 0;
        
        // Charger les régions du marché (préserver la structure)
        if (data.marketRegions) {
            for (const region in data.marketRegions) {
                if (this.marketRegions[region]) {
                    this.marketRegions[region].unlocked = data.marketRegions[region].unlocked;
                    this.marketRegions[region].reputation = data.marketRegions[region].reputation;
                }
            }
        }
        
        // Charger les contrats actifs et spéciaux
        this.activeContracts = data.activeContracts || [];
        this.specialContracts = data.specialContracts || [];
        
        // Charger l'historique des ventes
        this.salesHistory = data.salesHistory || { daily: [], weekly: [], monthly: [] };
        
        this.updateUI();
    }
    
    update(deltaTime) {
        // Mise à jour du temps pour la génération de contrats
        this.contractGenerationTime += deltaTime;
        
        // Générer un nouveau contrat si le temps est écoulé
        if (this.contractGenerationTime >= this.contractGenerationInterval) {
            this.generateContract();
            this.contractGenerationTime = 0;
        }
        
        // Mise à jour des saisons (chaque saison dure 7 jours de jeu)
        const gameTime = this.engine.getGameTime();
        if (gameTime && gameTime.day % 7 === 0) {
            this.updateSeason();
        }
        
        // Si des voitures ont été produites, les vendre automatiquement
        const productionModule = this.engine.modules.production;
        if (productionModule && productionModule.completedComponents.delivery > 0) {
            this.sellCars(productionModule.completedComponents.delivery);
        }
    }
    
    updateSeason() {
        // Passer à la saison suivante
        this.currentSeason = (this.currentSeason + 1) % this.seasons.length;
        const seasonName = this.seasons[this.currentSeason];
        
        // Notification du changement de saison
        this.engine.showNotification(`Nouvelle saison: ${this.getSeasonName(seasonName)}!`);
        
        // Mise à jour de l'interface
        this.updateUI();
    }
    
    getSeasonName(season) {
        const names = {
            winter: "Hiver",
            spring: "Printemps",
            summer: "Été",
            fall: "Automne"
        };
        return names[season] || season;
    }
    
    sellCars(count) {
        if (count <= 0) return 0;
        
        const productionModule = this.engine.modules.production;
        if (!productionModule) return 0;
        
        const carType = productionModule.currentCarType;
        const carTypeData = productionModule.carTypes[carType];
        if (!carTypeData) return 0;
        
        let totalRevenue = 0;
        let totalSold = 0;
        
        // Diviser les ventes entre les régions débloquées
        const unlockedRegions = Object.keys(this.marketRegions).filter(r => this.marketRegions[r].unlocked);
        const carsPerRegion = Math.floor(count / unlockedRegions.length);
        let remainingCars = count;
        
        unlockedRegions.forEach(regionKey => {
            const region = this.marketRegions[regionKey];
            
            // Déterminer combien de voitures peuvent être vendues dans cette région
            let carsToSell = Math.min(carsPerRegion, remainingCars);
            remainingCars -= carsToSell;
            
            if (carsToSell <= 0) return;
            
            // Calculer le prix en tenant compte des préférences régionales et saisonnières
            const basePrice = carTypeData.basePrice;
            const regionPreference = region.preferences[carType] || 1.0;
            
            // Préférences saisonnières
            const currentSeasonKey = this.seasons[this.currentSeason];
            const seasonalPreference = this.seasonalPreferences[currentSeasonKey][carType] || 1.0;
            
            // Réputation dans la région
            const reputationBonus = 1 + (region.reputation * 0.01); // +1% par point de réputation
            
            // Marketing boost
            const marketingBoost = 1 + (this.marketingLevel - 1) * this.marketingEffectiveness;
            
            // Prix final
            const finalPrice = basePrice * region.priceMultiplier * regionPreference * seasonalPreference * reputationBonus * marketingBoost;
            
            // Revenus après taxes
            const taxAmount = finalPrice * region.taxRate;
            const revenuePerCar = finalPrice - taxAmount;
            const revenue = revenuePerCar * carsToSell;
            
            // Ajouter aux revenus totaux
            totalRevenue += revenue;
            totalSold += carsToSell;
            
            // Augmenter la réputation dans cette région
            region.reputation += carsToSell * 0.01; // +0.01 point de réputation par voiture vendue
            
            // Ajouter à l'historique des ventes
            this.recordSale(regionKey, carType, carsToSell, revenue);
        });
        
        // Donner l'argent au joueur
        if (totalRevenue > 0) {
            this.engine.addMoney(totalRevenue);
            
            // Augmenter la valeur de la marque
            this.brandValue += totalRevenue * 0.01; // 1% des revenus ajoute à la valeur de la marque
            
            // Notification
            this.engine.showNotification(`${totalSold} ${carType} vendue(s) pour ${this.engine.formatNumber(totalRevenue)}$!`);
        }
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // Retourner le nombre de voitures vendues pour que Production puisse les retirer
        return totalSold;
    }
    
    recordSale(region, carType, count, revenue) {
        // Enregistrer la vente dans l'historique quotidien
        this.salesHistory.daily.push({
            day: this.engine.getGameTime().day,
            region: region,
            carType: carType,
            count: count,
            revenue: revenue
        });
        
        // Limiter l'historique quotidien aux 30 derniers jours
        if (this.salesHistory.daily.length > 30) {
            this.salesHistory.daily.shift();
        }
        
        // Agréger les données hebdomadaires et mensuelles périodiquement
        const currentDay = this.engine.getGameTime().day;
        if (currentDay % 7 === 0) {
            this.agregateWeeklySales();
        }
        if (currentDay % 30 === 0) {
            this.agregateMonthylSales();
        }
    }
    
    agregateWeeklySales() {
        // Agréger les ventes de la semaine
        const lastWeekSales = this.salesHistory.daily.slice(-7);
        
        const weeklySummary = {
            week: Math.floor(this.engine.getGameTime().day / 7),
            totalCars: 0,
            totalRevenue: 0,
            byRegion: {},
            byType: {}
        };
        
        lastWeekSales.forEach(sale => {
            weeklySummary.totalCars += sale.count;
            weeklySummary.totalRevenue += sale.revenue;
            
            // Par région
            if (!weeklySummary.byRegion[sale.region]) {
                weeklySummary.byRegion[sale.region] = { count: 0, revenue: 0 };
            }
            weeklySummary.byRegion[sale.region].count += sale.count;
            weeklySummary.byRegion[sale.region].revenue += sale.revenue;
            
            // Par type de voiture
            if (!weeklySummary.byType[sale.carType]) {
                weeklySummary.byType[sale.carType] = { count: 0, revenue: 0 };
            }
            weeklySummary.byType[sale.carType].count += sale.count;
            weeklySummary.byType[sale.carType].revenue += sale.revenue;
        });
        
        this.salesHistory.weekly.push(weeklySummary);
        
        // Limiter l'historique hebdomadaire aux 52 dernières semaines
        if (this.salesHistory.weekly.length > 52) {
            this.salesHistory.weekly.shift();
        }
    }
    
    agregateMonthylSales() {
        // Agréger les ventes du mois
        const lastMonthSales = this.salesHistory.daily.slice(-30);
        
        const monthlySummary = {
            month: Math.floor(this.engine.getGameTime().day / 30),
            totalCars: 0,
            totalRevenue: 0,
            byRegion: {},
            byType: {}
        };
        
        lastMonthSales.forEach(sale => {
            monthlySummary.totalCars += sale.count;
            monthlySummary.totalRevenue += sale.revenue;
            
            // Par région
            if (!monthlySummary.byRegion[sale.region]) {
                monthlySummary.byRegion[sale.region] = { count: 0, revenue: 0 };
            }
            monthlySummary.byRegion[sale.region].count += sale.count;
            monthlySummary.byRegion[sale.region].revenue += sale.revenue;
            
            // Par type de voiture
            if (!monthlySummary.byType[sale.carType]) {
                monthlySummary.byType[sale.carType] = { count: 0, revenue: 0 };
            }
            monthlySummary.byType[sale.carType].count += sale.count;
            monthlySummary.byType[sale.carType].revenue += sale.revenue;
        });
        
        this.salesHistory.monthly.push(monthlySummary);
        
        // Limiter l'historique mensuel aux 24 derniers mois
        if (this.salesHistory.monthly.length > 24) {
            this.salesHistory.monthly.shift();
        }
    }
    
    unlockRegion(regionKey) {
        const region = this.marketRegions[regionKey];
        
        if (!region || region.unlocked) return false;
        
        // Vérifier les prérequis
        const researchModule = this.engine.modules.research;
        const researchPoints = researchModule ? researchModule.getResearchPoints() : 0;
        
        if (researchPoints < (region.unlockResearch || 0)) {
            this.engine.showNotification(`Recherche insuffisante! (${researchPoints}/${region.unlockResearch})`, 'error');
            return false;
        }
        
        if (this.engine.spendMoney(region.unlockCost)) {
            region.unlocked = true;
            
            // Dépenser les points de recherche
            if (researchModule && region.unlockResearch) {
                researchModule.spendResearchPoints(region.unlockResearch);
            }
            
            this.engine.showNotification(`Nouveau marché débloqué: ${region.name}!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    upgradeBrand() {
        const upgradeCost = this.brandUpgradeCost * Math.pow(this.brandUpgradeMultiplier, this.brandLevel - 1);
        
        if (this.engine.spendMoney(upgradeCost)) {
            this.brandLevel++;
            this.brandValue += upgradeCost * 0.5; // 50% du coût est ajouté à la valeur de la marque
            
            // Bonus pour tous les marchés
            Object.values(this.marketRegions).forEach(region => {
                if (region.unlocked) {
                    region.priceMultiplier *= 1.05; // +5% sur les prix par niveau
                }
            });
            
            this.engine.showNotification(`Marque améliorée au niveau ${this.brandLevel}!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    upgradeMarketing() {
        const upgradeCost = this.marketingCost * Math.pow(this.marketingCostMultiplier, this.marketingLevel - 1);
        
        if (this.engine.spendMoney(upgradeCost)) {
            this.marketingLevel++;
            
            this.engine.showNotification(`Marketing amélioré au niveau ${this.marketingLevel}!`);
            this.updateUI();
            return true;
        } else {
            this.engine.showNotification('Fonds insuffisants!', 'error');
            return false;
        }
    }
    
    generateInitialContracts() {
        // Générer quelques contrats initiaux
        for (let i = 0; i < this.maxActiveContracts; i++) {
            this.generateContract();
        }
    }
    
    generateContract() {
        if (this.activeContracts.length >= this.maxActiveContracts) {
            // Remplacer un contrat existant si le maximum est atteint
            this.activeContracts.shift();
        }
        
        const productionModule = this.engine.modules.production;
        if (!productionModule) return null;
        
        // Sélectionner un type de voiture débloqué au hasard
        const unlockedCarTypes = Object.keys(productionModule.carTypes)
            .filter(type => productionModule.carTypes[type].unlocked);
        
        if (unlockedCarTypes.length === 0) return null;
        
        const randomCarType = unlockedCarTypes[Math.floor(Math.random() * unlockedCarTypes.length)];
        const carTypeData = productionModule.carTypes[randomCarType];
        
        // Sélectionner une région débloquée au hasard
        const unlockedRegions = Object.keys(this.marketRegions)
            .filter(region => this.marketRegions[region].unlocked);
        
        if (unlockedRegions.length === 0) return null;
        
        const randomRegion = unlockedRegions[Math.floor(Math.random() * unlockedRegions.length)];
        const regionData = this.marketRegions[randomRegion];
        
        // Déterminer la quantité et le prix
        const quantity = Math.floor(10 + Math.random() * 40 * this.brandLevel);
        const basePrice = carTypeData.basePrice;
        const contractBonus = 1.2 + Math.random() * 0.3; // Bonus de 20-50% sur le prix normal
        const pricePerCar = basePrice * regionData.priceMultiplier * contractBonus;
        const totalValue = pricePerCar * quantity;
        
        // Délai de livraison (en jours)
        const deadline = this.engine.getGameTime().day + Math.floor(5 + Math.random() * 10);
        
        // Générer le nouveau contrat
        const newContract = {
            id: Date.now(),
            region: randomRegion,
            regionName: regionData.name,
            carType: randomCarType,
            quantity: quantity,
            pricePerCar: pricePerCar,
            totalValue: totalValue,
            deadline: deadline,
            reputationBonus: Math.floor(quantity * 0.1), // Bonus de réputation en cas de succès
            reputationPenalty: Math.floor(quantity * 0.2) // Pénalité de réputation en cas d'échec
        };
        
        this.activeContracts.push(newContract);
        this.updateUI();
        this.engine.showNotification(`Nouveau contrat disponible: ${quantity} ${randomCarType} pour ${regionData.name}!`);
        
        return newContract;
    }
    
    takeContract(contractId) {
        const contractIndex = this.activeContracts.findIndex(c => c.id === contractId);
        if (contractIndex === -1) return false;
        
        const contract = this.activeContracts[contractIndex];
        
        // Transférer le contrat vers les contrats spéciaux
        this.specialContracts.push(contract);
        this.activeContracts.splice(contractIndex, 1);
        
        this.engine.showNotification(`Contrat accepté: ${contract.quantity} ${contract.carType} pour ${contract.regionName}!`);
        this.updateUI();
        
        return true;
    }
    
    completeContract(contractId) {
        const contractIndex = this.specialContracts.findIndex(c => c.id === contractId);
        if (contractIndex === -1) return false;
        
        const contract = this.specialContracts[contractIndex];
        const productionModule = this.engine.modules.production;
        
        if (!productionModule) return false;
        
        // Vérifier si nous avons assez de voitures en stock
        if (productionModule.completedComponents.delivery < contract.quantity) {
            this.engine.showNotification(`Pas assez de voitures en stock pour compléter ce contrat!`, 'error');
            return false;
        }
        
        // Vérifier si c'est le bon type de voiture
        if (productionModule.currentCarType !== contract.carType) {
            this.engine.showNotification(`Ce contrat nécessite des "${contract.carType}" mais vous produisez des "${productionModule.currentCarType}"!`, 'error');
            return false;
        }
        
        // Retirer les voitures de l'inventaire
        productionModule.completedComponents.delivery -= contract.quantity;
        
        // Ajouter les revenus
        this.engine.addMoney(contract.totalValue);
        
        // Ajouter de la réputation
        this.marketRegions[contract.region].reputation += contract.reputationBonus;
        
        // Notifier et supprimer le contrat
        this.engine.showNotification(`Contrat complété! +${this.engine.formatNumber(contract.totalValue)}$ et +${contract.reputationBonus} réputation dans ${contract.regionName}!`);
        this.specialContracts.splice(contractIndex, 1);
        
        // Générer un nouveau contrat pour le remplacer
        this.generateContract();
        
        this.updateUI();
        return true;
    }
    
    checkExpiredContracts() {
        const currentDay = this.engine.getGameTime().day;
        const expiredContracts = [];
        
        // Vérifier les contrats spéciaux
        this.specialContracts = this.specialContracts.filter(contract => {
            if (contract.deadline < currentDay) {
                // Appliquer la pénalité de réputation
                if (this.marketRegions[contract.region]) {
                    this.marketRegions[contract.region].reputation -= contract.reputationPenalty;
                    // Éviter une réputation négative
                    if (this.marketRegions[contract.region].reputation < 0) {
                        this.marketRegions[contract.region].reputation = 0;
                    }
                }
                
                this.engine.showNotification(`Contrat expiré! -${contract.reputationPenalty} réputation dans ${contract.regionName}!`, 'error');
                expiredContracts.push(contract);
                return false;
            }
            return true;
        });
        
        // Remplacer les contrats expirés
        expiredContracts.forEach(() => {
            this.generateContract();
        });
        
        this.updateUI();
    }
    
    processOfflineTime(seconds) {
        // Convertir en jours de jeu (1 jour = 86400 secondes)
        const daysOffline = Math.floor(seconds / 86400);
        
        if (daysOffline > 0) {
            // Mettre à jour les saisons
            const seasonsToAdvance = Math.floor(daysOffline / 7);
            if (seasonsToAdvance > 0) {
                this.currentSeason = (this.currentSeason + seasonsToAdvance) % this.seasons.length;
            }
            
            // Générer des contrats proportionnellement au temps écoulé
            const contractsToGenerate = Math.min(daysOffline, this.maxActiveContracts);
            this.activeContracts = []; // Effacer les anciens contrats
            
            for (let i = 0; i < contractsToGenerate; i++) {
                this.generateContract();
            }
            
            // Vérifier les contrats expirés
            this.checkExpiredContracts();
        }
    }
    
    reset() {
        // Réinitialiser les régions du marché
        Object.keys(this.marketRegions).forEach(region => {
            const regionData = this.marketRegions[region];
            regionData.unlocked = region === 'local'; // Seul le marché local est débloqué
            regionData.reputation = 0;
        });
        
        // Réinitialiser les contrats
        this.activeContracts = [];
        this.specialContracts = [];
        this.contractGenerationTime = 0;
        this.maxActiveContracts = 1;
        
        // Réinitialiser la marque et le marketing
        this.brandValue = 0;
        this.brandLevel = 1;
        this.brandUpgradeCost = 25000;
        this.marketingLevel = 1;
        this.marketingCost = 5000;
        
        // Réinitialiser la saison
        this.currentSeason = 0;
        
        // Réinitialiser l'historique des ventes
        this.salesHistory = { daily: [], weekly: [], monthly: [] };
        
        // Générer des contrats initiaux
        this.generateInitialContracts();
        
        this.updateUI();
    }
    
    setupEventListeners() {
        // Déverrouillage des régions
        document.querySelectorAll('.unlock-region-button').forEach(button => {
            const region = button.getAttribute('data-region');
            button.addEventListener('click', () => {
                this.unlockRegion(region);
            });
        });
        
        // Amélioration de la marque
        document.getElementById('upgrade-brand').addEventListener('click', () => {
            this.upgradeBrand();
        });
        
        // Amélioration du marketing
        document.getElementById('upgrade-marketing').addEventListener('click', () => {
            this.upgradeMarketing();
        });
        
        // Prendre un contrat
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('take-contract-button')) {
                const contractId = parseInt(e.target.getAttribute('data-contract'));
                this.takeContract(contractId);
            }
        });
        
        // Compléter un contrat
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('complete-contract-button')) {
                const contractId = parseInt(e.target.getAttribute('data-contract'));
                this.completeContract(contractId);
            }
        });
    }
}
    