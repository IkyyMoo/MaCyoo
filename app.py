"""
Valentine's Day Memory Space - Flask Backend
A romantic web application for creating personalized Valentine's Day memories
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

# Data storage file
DATA_FILE = 'memories.json'

class MemoryManager:
    """Manages romantic memories and messages"""
    
    def __init__(self, filename=DATA_FILE):
        self.filename = filename
        self.memories = self._load_memories()
    
    def _load_memories(self):
        """Load memories from JSON file"""
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return self._default_memories()
        return self._default_memories()
    
    def _default_memories(self):
        """Return default memory structure"""
        return {
            'created_date': datetime.now().isoformat(),
            'sections': {
                'story': {
                    'title': 'Our Story',
                    'content': 'Add your beautiful story here...',
                    'is_locked': False
                },
                'moments': {
                    'title': 'Cherished Moments',
                    'items': [],
                    'is_locked': False
                },
                'adoration': {
                    'title': 'Things I Adore About You',
                    'items': [],
                    'is_locked': False
                },
                'surprise': {
                    'title': 'A Secret Just For You',
                    'content': 'Your surprise message will appear here...',
                    'is_locked': True,
                    'unlock_condition': 'scroll_to_end'
                }
            },
            'visitor_interactions': [],
            'theme': {
                'primary_color': '#8B4757',
                'secondary_color': '#F5D5D9',
                'accent_color': '#D4A5A5'
            }
        }
    
    def save_memories(self):
        """Save memories to JSON file"""
        try:
            with open(self.filename, 'w', encoding='utf-8') as f:
                json.dump(self.memories, f, indent=2, ensure_ascii=False)
            return True
        except IOError as e:
            print(f"Error saving memories: {e}")
            return False
    
    def add_moment(self, title, description, emoji):
        """Add a cherished moment"""
        moment = {
            'id': len(self.memories['sections']['moments']['items']) + 1,
            'title': title,
            'description': description,
            'emoji': emoji,
            'timestamp': datetime.now().isoformat()
        }
        self.memories['sections']['moments']['items'].append(moment)
        self.save_memories()
        return moment
    
    def add_admiration(self, label, description):
        """Add an adoration item"""
        item = {
            'id': len(self.memories['sections']['adoration']['items']) + 1,
            'label': label,
            'description': description,
            'timestamp': datetime.now().isoformat()
        }
        self.memories['sections']['adoration']['items'].append(item)
        self.save_memories()
        return item
    
    def record_interaction(self, interaction_type, data=None):
        """Record visitor interaction for analytics"""
        interaction = {
            'type': interaction_type,
            'timestamp': datetime.now().isoformat(),
            'data': data or {}
        }
        self.memories['visitor_interactions'].append(interaction)
        self.save_memories()
        return interaction
    
    def get_memories(self):
        """Get all memories"""
        return self.memories
    
    def update_story(self, content):
        """Update the main story"""
        self.memories['sections']['story']['content'] = content
        self.save_memories()
        return True
    
    def update_surprise(self, content):
        """Update surprise message"""
        self.memories['sections']['surprise']['content'] = content
        self.save_memories()
        return True


# Initialize memory manager
memory_manager = MemoryManager()


# Routes
@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')


@app.route('/api/memories', methods=['GET'])
def get_memories():
    """Get all memories"""
    memories = memory_manager.get_memories()
    return jsonify({
        'success': True,
        'data': memories
    })


@app.route('/api/moments', methods=['GET'])
def get_moments():
    """Get all cherished moments"""
    moments = memory_manager.memories['sections']['moments']['items']
    return jsonify({
        'success': True,
        'data': moments
    })


@app.route('/api/moments', methods=['POST'])
def add_moment():
    """Add a new cherished moment"""
    data = request.get_json()
    
    if not data or 'title' not in data or 'description' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing required fields'
        }), 400
    
    moment = memory_manager.add_moment(
        title=data.get('title'),
        description=data.get('description'),
        emoji=data.get('emoji', '💕')
    )
    
    memory_manager.record_interaction('moment_added', {
        'moment_id': moment['id'],
        'title': moment['title']
    })
    
    return jsonify({
        'success': True,
        'data': moment
    }), 201


@app.route('/api/adoration', methods=['GET'])
def get_adoration():
    """Get all adoration items"""
    items = memory_manager.memories['sections']['adoration']['items']
    return jsonify({
        'success': True,
        'data': items
    })


@app.route('/api/adoration', methods=['POST'])
def add_adoration():
    """Add a new adoration item"""
    data = request.get_json()
    
    if not data or 'label' not in data or 'description' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing required fields'
        }), 400
    
    item = memory_manager.add_admiration(
        label=data.get('label'),
        description=data.get('description')
    )
    
    memory_manager.record_interaction('adoration_added', {
        'item_id': item['id'],
        'label': item['label']
    })
    
    return jsonify({
        'success': True,
        'data': item
    }), 201


@app.route('/api/story', methods=['GET'])
def get_story():
    """Get the story"""
    story = memory_manager.memories['sections']['story']
    return jsonify({
        'success': True,
        'data': story
    })


@app.route('/api/story', methods=['PUT'])
def update_story():
    """Update the story"""
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({
            'success': False,
            'message': 'Content is required'
        }), 400
    
    memory_manager.update_story(data.get('content'))
    
    memory_manager.record_interaction('story_updated')
    
    return jsonify({
        'success': True,
        'message': 'Story updated successfully'
    })


@app.route('/api/surprise', methods=['GET'])
def get_surprise():
    """Get the surprise message (only after unlocking)"""
    surprise = memory_manager.memories['sections']['surprise']
    return jsonify({
        'success': True,
        'data': surprise
    })


@app.route('/api/surprise', methods=['PUT'])
def update_surprise():
    """Update surprise message"""
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({
            'success': False,
            'message': 'Content is required'
        }), 400
    
    memory_manager.update_surprise(data.get('content'))
    
    memory_manager.record_interaction('surprise_updated')
    
    return jsonify({
        'success': True,
        'message': 'Surprise updated successfully'
    })


@app.route('/api/interactions', methods=['POST'])
def record_interaction():
    """Record user interaction"""
    data = request.get_json()
    
    if not data or 'type' not in data:
        return jsonify({
            'success': False,
            'message': 'Interaction type is required'
        }), 400
    
    interaction = memory_manager.record_interaction(
        interaction_type=data.get('type'),
        data=data.get('data')
    )
    
    return jsonify({
        'success': True,
        'data': interaction
    }), 201


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get interaction analytics"""
    interactions = memory_manager.memories['visitor_interactions']
    
    analytics = {
        'total_interactions': len(interactions),
        'interactions_by_type': {},
        'last_interaction': interactions[-1] if interactions else None
    }
    
    for interaction in interactions:
        interaction_type = interaction.get('type')
        analytics['interactions_by_type'][interaction_type] = \
            analytics['interactions_by_type'].get(interaction_type, 0) + 1
    
    return jsonify({
        'success': True,
        'data': analytics
    })


@app.route('/api/theme', methods=['GET'])
def get_theme():
    """Get theme colors"""
    theme = memory_manager.memories['theme']
    return jsonify({
        'success': True,
        'data': theme
    })


@app.route('/api/theme', methods=['PUT'])
def update_theme():
    """Update theme colors"""
    data = request.get_json()
    
    if data:
        memory_manager.memories['theme'].update(data)
        memory_manager.save_memories()
    
    return jsonify({
        'success': True,
        'data': memory_manager.memories['theme']
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'message': 'Resource not found'
    }), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)