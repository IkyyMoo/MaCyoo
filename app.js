/**
 * Valentine's Day Memory Space - Interactive Frontend
 * Handles all animations, interactions, and API communication
 */

class ValentineMemorySpace {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentScroll = 0;
        this.surpriseUnlocked = false;
        this.init();
    }

    async init() {
        console.log('🎁 Initializing Valentine Memory Space...');
        this.setupEventListeners();
        await this.loadMemories();
        this.setupScrollObserver();
        this.recordInteraction('page_loaded');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // CTA Button
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', () => this.recordInteraction('cta_clicked'));
        }

        // Unlock hint button
        const unlockHint = document.getElementById('unlockHint');
        if (unlockHint) {
            unlockHint.addEventListener('click', () => this.revealSurprise());
        }

        // Window scroll events
        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('resize', () => this.handleResize());

        // Moment and adoration card hover effects
        this.setupCardInteractions();
    }

    /**
     * Setup card interaction animations
     */
    setupCardInteractions() {
        const cards = document.querySelectorAll('.moment-card, .admiration-item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.recordInteraction('card_hovered', {
                    card_type: card.classList.contains('moment-card') ? 'moment' : 'admiration'
                });
            });

            card.addEventListener('click', () => {
                this.recordInteraction('card_clicked', {
                    card_type: card.classList.contains('moment-card') ? 'moment' : 'admiration',
                    card_content: card.innerText.substring(0, 50)
                });
            });
        });
    }

    /**
     * Handle smooth scroll navigation
     */
    handleSmoothScroll(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        const element = document.querySelector(href);
        
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            this.recordInteraction('navigation', { target: href });
        }
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        this.currentScroll = window.scrollY;
        this.updateScrollProgress();
        this.checkSurpriseUnlockCondition();
        this.handleParallaxEffects();
    }

    /**
     * Update scroll progress indicator
     */
    updateScrollProgress() {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (this.currentScroll / totalScroll) * 100;
        
        // Update any progress indicators if they exist
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = scrollPercent + '%';
        }
    }

    /**
     * Check if surprise should unlock
     */
    checkSurpriseUnlockCondition() {
        const adorationSection = document.getElementById('adoration');
        const surpriseSection = document.getElementById('surprise');
        const unlockHint = document.getElementById('unlockHint');

        if (!adorationSection || !surpriseSection) return;

        const adorationPosition = adorationSection.offsetTop + adorationSection.offsetHeight;
        const currentScroll = window.scrollY + window.innerHeight;

        if (currentScroll > adorationPosition && !this.surpriseUnlocked) {
            if (unlockHint) {
                unlockHint.classList.add('show');
            }
        }
    }

    /**
     * Handle parallax effects
     */
    handleParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 0.5;
            const yPos = this.currentScroll * speed;
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    /**
     * Reveal surprise section
     */
    revealSurprise() {
        const surpriseSection = document.getElementById('surprise');
        const unlockHint = document.getElementById('unlockHint');

        if (!surpriseSection) return;

        surpriseSection.classList.add('revealed');
        this.surpriseUnlocked = true;

        if (unlockHint) {
            unlockHint.style.display = 'none';
        }

        setTimeout(() => {
            surpriseSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        this.recordInteraction('surprise_unlocked');
        this.playHeartAnimation();
    }

    /**
     * Play celebratory heart animation
     */
    playHeartAnimation() {
        const colors = ['#8B4757', '#F5D5D9', '#D4A5A5'];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.innerHTML = '💕';
                heart.style.position = 'fixed';
                heart.style.left = Math.random() * window.innerWidth + 'px';
                heart.style.top = window.innerHeight - 50 + 'px';
                heart.style.fontSize = '2rem';
                heart.style.pointerEvents = 'none';
                heart.style.zIndex = '9999';
                heart.style.animation = `floatUp 2s ease-out forwards`;
                
                document.body.appendChild(heart);
                
                setTimeout(() => heart.remove(), 2000);
            }, i * 100);
        }
    }

    /**
     * Load memories from API
     */
    async loadMemories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/memories`);
            const result = await response.json();
            
            if (result.success) {
                console.log('✨ Memories loaded:', result.data);
                this.populateMemories(result.data);
            }
        } catch (error) {
            console.error('Error loading memories:', error);
        }
    }

    /**
     * Populate memories into the DOM
     */
    populateMemories(memories) {
        // This would be customized based on your specific structure
        console.log('💭 Populating memories...');
    }

    /**
     * Record user interaction
     */
    async recordInteraction(type, data = {}) {
        try {
            await fetch(`${this.apiBaseUrl}/interactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    data: data
                })
            });
        } catch (error) {
            console.error('Error recording interaction:', error);
        }
    }

    /**
     * Add a new moment
     */
    async addMoment(title, description, emoji = '💕') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/moments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    emoji: emoji
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('✨ Moment added:', result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error adding moment:', error);
        }
    }

    /**
     * Add a new adoration item
     */
    async addAdoration(label, description) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/adoration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    label: label,
                    description: description
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('✨ Adoration added:', result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error adding adoration:', error);
        }
    }

    /**
     * Update story
     */
    async updateStory(content) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/story`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: content })
            });

            const result = await response.json();
            if (result.success) {
                console.log('📖 Story updated');
                return true;
            }
        } catch (error) {
            console.error('Error updating story:', error);
        }
    }

    /**
     * Update surprise message
     */
    async updateSurprise(content) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/surprise`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: content })
            });

            const result = await response.json();
            if (result.success) {
                console.log('🎁 Surprise updated');
                return true;
            }
        } catch (error) {
            console.error('Error updating surprise:', error);
        }
    }

    /**
     * Get analytics
     */
    async getAnalytics() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/analytics`);
            const result = await response.json();
            
            if (result.success) {
                console.log('📊 Analytics:', result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupScrollObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    this.recordInteraction('section_viewed', {
                        section: entry.target.id
                    });
                }
            });
        }, observerOptions);

        document.querySelectorAll('.moment-card, .admiration-item, .story-container').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        console.log('Window resized');
    }
}

// Add CSS animation for floating hearts
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateY(-300px);
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.valentineSpace = new ValentineMemorySpace();
    });
} else {
    window.valentineSpace = new ValentineMemorySpace();
}