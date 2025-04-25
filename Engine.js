// Engine.js - Moteur principal du jeu
class GameEngine {
    constructor() {
        this.gameState = null;
        this.lastUpdate = Date.now();
        this.isRunning = false;
        this.saveInterval = 60000; // Sauvegarde automatique toutes les minutes
        this.lastSave = Date.now();
        this.modules = {};
        
        // Initialisation des modules au chargement
        window.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        // Chargement de la sauvegarde ou initialisation d'un nouveau jeu
        if (!this.loadGame()) {
            this.newGame();
        }
        
        // Démarrage de la boucle de jeu
        this.start();
        
        // Configuration des événements UI
        this.setupEventListeners();
    }

    registerModule(name, module) {
        this.modules[name] = module;
        return module;
    }

    newGame() {
        // État initial du jeu
        this.gameState = {
            money: 10000,
            reputation: 0,
            time: {
                day: 1,
                totalDays: 1
            },
            stats: {
                carsProduced: 0,
                moneyEarned: 0,
                upgradesPurchased: 0
            },
            lastUpdate: Date.now()
        };
    }

    saveGame() {
        const saveData = {
            gameState: this.gameState,
            production: this.modules.production ? this.modules.production.save() : null,
            research: this.modules.research ? this.modules.research.save() : null,
            market: this.modules.market ? this.modules.market.save() : null,
            factory: this.modules.factory ? this.modules.factory.save() : null,
            achievements: this.modules.achievements ? this.modules.achievements.save() : null
        };
        
        try {
            localStorage.setItem('autofactoryIdleGame', JSON.stringify(saveData));
            console.log('Jeu sauvegardé!');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem('autofactoryIdleGame');
            if (!saveData) return false;
            
            const parsedData = JSON.parse(saveData);
            this.gameState = parsedData.gameState;
            
            // Mise à jour du temps offline
            const now = Date.now();
            const timeDiff = now - this.gameState.lastUpdate;
            if (timeDiff > 0) {
                this.processOfflineProgress(timeDiff);
            }
            this.gameState.lastUpdate = now;
            
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement de la sauvegarde:', error);
            return false;
        }
    }

    processOfflineProgress(timeDiffMs) {
        // Calcul de la progression hors ligne
        const offlineTimeInSeconds = timeDiffMs / 1000;
        
        // Informer l'utilisateur
        if (offlineTimeInSeconds > 60) {
            const minutes = Math.floor(offlineTimeInSeconds / 60);
            alert(`Vous avez été absent pendant ${minutes} minutes. Votre usine a continué à fonctionner pendant ce temps!`);
        }
        
        // Appliquer la progression à chaque module
        Object.values(this.modules).forEach(module => {
            if (module.processOfflineTime) {
                module.processOfflineTime(offlineTimeInSeconds);
            }
        });
    }

    resetGame() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ? Toute progression sera perdue.')) {
            localStorage.removeItem('autofactoryIdleGame');
            this.newGame();
            
            // Réinitialiser chaque module
            Object.values(this.modules).forEach(module => {
                if (module.reset) {
                    module.reset();
                }
            });
            
            // Mettre à jour l'interface
            this.updateUI();
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdate = Date.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Temps écoulé en secondes
        
        // Mise à jour de chaque module
        Object.values(this.modules).forEach(module => {
            if (module.update) {
                module.update(deltaTime);
            }
        });
        
        // Sauvegarde automatique
        if (now - this.lastSave > this.saveInterval) {
            this.saveGame();
            this.lastSave = now;
        }
        
        // Mise à jour de l'interface
        this.updateUI();
        
        // Mise à jour du temps
        this.lastUpdate = now;
        this.gameState.lastUpdate = now;
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    updateUI() {
        // Mise à jour de l'argent
        document.getElementById('money').textContent = this.formatNumber(this.gameState.money);
        
        // Mise à jour des statistiques
        document.getElementById('cars-produced').textContent = this.formatNumber(this.gameState.stats.carsProduced);
        document.getElementById('money-earned').textContent = this.formatNumber(this.gameState.stats.moneyEarned);
        
        // Mise à jour du jour de jeu
        document.getElementById('day').textContent = this.gameState.time.day;
        
        // Demander aux modules de mettre à jour leur propre UI
        Object.values(this.modules).forEach(module => {
            if (module.updateUI) {
                module.updateUI();
            }
        });
    }

    setupEventListeners() {
        // Bouton de sauvegarde manuelle
        document.getElementById('save-button').addEventListener('click', () => {
            if (this.saveGame()) {
                this.showNotification('Jeu sauvegardé avec succès!');
            } else {
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            }
        });
        
        // Bouton de réinitialisation
        document.getElementById('reset-button').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Navigation dans les onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Cacher tous les contenus d'onglet
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Désélectionner tous les boutons d'onglet
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Activer l'onglet sélectionné
        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return Math.floor(num).toLocaleString();
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.getElementById('notifications').appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    // Méthodes utilitaires pour les modules
    addMoney(amount) {
        this.gameState.money += amount;
        this.gameState.stats.moneyEarned += amount;
    }

    spendMoney(amount) {
        if (this.gameState.money >= amount) {
            this.gameState.money -= amount;
            return true;
        }
        return false;
    }

    getGameTime() {
        return this.gameState.time;
    }

    advanceDay() {
        this.gameState.time.day++;
        this.gameState.time.totalDays++;
    }
}

// Export du moteur de jeu
const engine = new GameEngine();
window.gameEngine = engine;