/**
 * NoteExtractor - Client-side note extraction from transcriptions
 * Supports both rule-based and AI-powered extraction
 */

class NoteExtractor {
    constructor() {
        this.apiKey = null;
        this.useAI = false;
        this.extractionMethod = 'rules';
        
        // Load settings from localStorage
        this.loadSettings();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('audioNotesSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                if (parsed.apiKey) {
                    this.setApiKey(parsed.apiKey);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Set OpenAI API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.useAI = !!(apiKey && apiKey.trim());
        this.extractionMethod = this.useAI ? 'ai' : 'rules';
    }

    /**
     * Extract notes from transcription
     */
    async extractNotes(transcription, context = 'general') {
        if (!transcription || !transcription.trim()) {
            throw new Error('No transcription provided');
        }

        const startTime = Date.now();
        let notes;

        try {
            if (this.useAI) {
                notes = await this.extractWithAI(transcription, context);
            } else {
                notes = this.extractWithRules(transcription, context);
            }

            // Add metadata
            notes.extraction_method = this.extractionMethod;
            notes.context = context;
            notes.timestamp = new Date().toISOString();
            notes.word_count = transcription.split(/\s+/).length;
            notes.processing_time = Date.now() - startTime;

            return notes;

        } catch (error) {
            console.error('Note extraction failed:', error);
            
            // Fallback to rule-based extraction
            if (this.useAI) {
                console.log('Falling back to rule-based extraction');
                notes = this.extractWithRules(transcription, context);
                notes.extraction_method = 'rules_fallback';
                notes.context = context;
                notes.timestamp = new Date().toISOString();
                notes.word_count = transcription.split(/\s+/).length;
                notes.processing_time = Date.now() - startTime;
                notes.fallback_reason = error.message;
                
                return notes;
            }
            
            throw error;
        }
    }

    /**
     * Extract notes using OpenAI API
     */
    async extractWithAI(transcription, context) {
        const prompts = {
            meeting: `
                Analyze this meeting transcription and extract:
                1. Key decisions made
                2. Action items and who is responsible  
                3. Important discussion points
                4. Next steps or follow-ups
                5. Any deadlines mentioned
                
                Format the response as JSON with these keys:
                - summary: Brief meeting summary
                - key_decisions: List of decisions
                - action_items: List with format "Task - Responsible person (if mentioned) - Deadline (if mentioned)"
                - discussion_points: Key topics discussed
                - next_steps: Follow-up actions
                - deadlines: Any dates or deadlines mentioned
            `,
            
            interview: `
                Analyze this interview transcription and extract:
                1. Key insights or quotes
                2. Main topics covered
                3. Important questions asked
                4. Notable responses
                5. Follow-up questions to consider
                
                Format as JSON with keys: summary, key_insights, topics_covered, notable_quotes, follow_up_questions
            `,
            
            lecture: `
                Analyze this lecture transcription and extract:
                1. Main concepts taught
                2. Key definitions
                3. Examples provided
                4. Important points to remember
                5. Questions raised
                
                Format as JSON with keys: summary, main_concepts, definitions, examples, key_points, questions
            `,
            
            general: `
                Analyze this conversation and extract:
                1. Main topics discussed
                2. Important points or insights
                3. Any tasks or follow-ups mentioned
                4. Key takeaways
                
                Format as JSON with keys: summary, main_topics, important_points, tasks, key_takeaways
            `
        };

        const prompt = prompts[context] || prompts.general;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert at analyzing conversations and extracting structured notes. Always return valid JSON.'
                        },
                        {
                            role: 'user',
                            content: `${prompt}\n\nTranscription:\n${transcription}`
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Extract JSON from response
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                const jsonContent = content.substring(jsonStart, jsonEnd);
                return JSON.parse(jsonContent);
            } else {
                throw new Error('No valid JSON found in AI response');
            }

        } catch (error) {
            console.error('AI extraction error:', error);
            throw error;
        }
    }

    /**
     * Extract notes using rule-based approach
     */
    extractWithRules(transcription, context) {
        const notes = {
            summary: this.generateSummary(transcription),
            action_items: this.extractActionItems(transcription),
            key_points: this.extractKeyPoints(transcription),
            questions: this.extractQuestions(transcription),
            decisions: this.extractDecisions(transcription),
            dates_times: this.extractDatesTimes(transcription),
            people_mentioned: this.extractPeople(transcription),
            topics: this.extractTopics(transcription)
        };

        return notes;
    }

    /**
     * Generate summary using rule-based approach
     */
    generateSummary(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length <= 2) {
            return text.substring(0, 200) + (text.length > 200 ? '...' : '');
        }
        
        // Take first sentence, longest sentence, and last sentence
        const first = sentences[0].trim();
        const last = sentences[sentences.length - 1].trim();
        const longest = sentences.reduce((a, b) => a.length > b.length ? a : b).trim();
        
        const summary = [first, longest, last]
            .filter((s, i, arr) => arr.indexOf(s) === i) // Remove duplicates
            .join('. ') + '.';
            
        return summary.length > 300 ? summary.substring(0, 300) + '...' : summary;
    }

    /**
     * Extract action items
     */
    extractActionItems(text) {
        const patterns = [
            /(?:need to|should|must|will|going to|have to)\s+([^.!?]{5,100})/gi,
            /(?:action item|todo|task):\s*([^.!?]{5,100})/gi,
            /(?:follow up|followup)\s+(?:on|with)?\s*([^.!?]{5,100})/gi,
            /(?:by|before)\s+(?:next|this)?\s*(?:week|month|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\s*([^.!?]{5,100})/gi,
            /(?:assign|assigned|responsible)\s+(?:to|for)?\s*([^.!?]{5,100})/gi
        ];

        const items = new Set();
        
        for (const pattern of patterns) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                if (match[1] && match[1].trim().length > 5) {
                    items.add(match[1].trim());
                }
            }
        }

        return Array.from(items);
    }

    /**
     * Extract key points
     */
    extractKeyPoints(text) {
        const patterns = [
            /(?:important|key|crucial|vital|essential|critical)(?:ly)?\s+([^.!?]{10,150})/gi,
            /(?:the main|primary|biggest|most)\s+(?:point|issue|concern|benefit)\s+(?:is|was)\s*([^.!?]{10,150})/gi,
            /(?:remember|note|keep in mind)\s+(?:that)?\s*([^.!?]{10,150})/gi,
            /(?:main takeaway|key insight|bottom line)(?:\s+is)?\s*([^.!?]{10,150})/gi
        ];

        const points = new Set();
        
        for (const pattern of patterns) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                if (match[1] && match[1].trim().length > 10) {
                    points.add(match[1].trim());
                }
            }
        }

        return Array.from(points);
    }

    /**
     * Extract questions
     */
    extractQuestions(text) {
        const sentences = text.split(/[.!?]+/);
        const questions = [];

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length > 5) {
                // Direct questions
                if (trimmed.includes('?')) {
                    questions.push(trimmed + '?');
                }
                // Question words
                else if (/^\s*(?:who|what|when|where|why|how|which|whose)\b/i.test(trimmed)) {
                    questions.push(trimmed + '?');
                }
                // Question patterns
                else if (/\b(?:can you|could you|would you|will you|do you|did you|have you|are you|is there|are there)\b/i.test(trimmed)) {
                    questions.push(trimmed + '?');
                }
            }
        }

        return questions;
    }

    /**
     * Extract decisions
     */
    extractDecisions(text) {
        const patterns = [
            /(?:decided|agreed|concluded|determined)\s+(?:that|to|on)?\s*([^.!?]{10,150})/gi,
            /(?:decision|conclusion|agreement)(?:\s+is|\s+was)?\s*([^.!?]{10,150})/gi,
            /(?:we will|we should|let's|we'll)\s+([^.!?]{10,150})/gi,
            /(?:final decision|consensus|settled on)\s*([^.!?]{10,150})/gi
        ];

        const decisions = new Set();
        
        for (const pattern of patterns) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                if (match[1] && match[1].trim().length > 10) {
                    decisions.add(match[1].trim());
                }
            }
        }

        return Array.from(decisions);
    }

    /**
     * Extract dates and times
     */
    extractDatesTimes(text) {
        const patterns = [
            /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{4}?\b/gi,
            /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
            /\b(?:next|this|last)\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
            /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi,
            /\b(?:tomorrow|today|yesterday)\b/gi,
            /\bin\s+\d+\s+(?:days|weeks|months)\b/gi
        ];

        const dates = new Set();
        
        for (const pattern of patterns) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                dates.add(match[0].trim());
            }
        }

        return Array.from(dates);
    }

    /**
     * Extract people mentioned
     */
    extractPeople(text) {
        const patterns = [
            /\b[A-Z][a-z]+\s+(?:said|mentioned|asked|suggested|proposed|will|should)\b/g,
            /\b(?:said|mentioned|asked|suggested|proposed)\s+[A-Z][a-z]+\b/g,
            /\b[A-Z][a-z]+\s+is\s+(?:responsible|assigned|handling)\b/g
        ];

        const people = new Set();
        
        for (const pattern of patterns) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                const words = match[0].split(/\s+/);
                for (const word of words) {
                    if (/^[A-Z][a-z]+$/.test(word) && word.length > 2) {
                        people.add(word);
                    }
                }
            }
        }

        return Array.from(people);
    }

    /**
     * Extract main topics
     */
    extractTopics(text) {
        // Simple keyword extraction
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 4);

        const wordCounts = {};
        for (const word of words) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }

        // Filter common words
        const commonWords = new Set([
            'that', 'this', 'with', 'have', 'will', 'from', 'they', 'know', 'want',
            'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here',
            'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than',
            'them', 'well', 'were', 'what', 'year', 'your', 'about', 'would', 'there',
            'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where',
            'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'under',
            'while', 'should', 'because', 'people', 'something', 'actually', 'really'
        ]);

        const topics = Object.entries(wordCounts)
            .filter(([word, count]) => count >= 2 && !commonWords.has(word))
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);

        return topics;
    }

    /**
     * Format notes into readable text
     */
    formatNotes(notes) {
        let formatted = `# Notes Extract - ${notes.context ? notes.context.charAt(0).toUpperCase() + notes.context.slice(1) : 'General'}\n`;
        formatted += `*Generated: ${new Date(notes.timestamp).toLocaleString()}*\n`;
        formatted += `*Word count: ${notes.word_count} | Method: ${notes.extraction_method}*\n\n`;

        if (notes.summary) {
            formatted += `## Summary\n${notes.summary}\n\n`;
        }

        if (notes.key_decisions && notes.key_decisions.length > 0) {
            formatted += `## Key Decisions\n`;
            for (const decision of notes.key_decisions) {
                formatted += `- ${decision}\n`;
            }
            formatted += '\n';
        }

        if (notes.action_items && notes.action_items.length > 0) {
            formatted += `## Action Items\n`;
            for (const item of notes.action_items) {
                formatted += `- [ ] ${item}\n`;
            }
            formatted += '\n';
        }

        if (notes.key_points && notes.key_points.length > 0) {
            formatted += `## Key Points\n`;
            for (const point of notes.key_points) {
                formatted += `- ${point}\n`;
            }
            formatted += '\n';
        }

        if (notes.questions && notes.questions.length > 0) {
            formatted += `## Questions\n`;
            for (const question of notes.questions) {
                formatted += `- ${question}\n`;
            }
            formatted += '\n';
        }

        if (notes.next_steps && notes.next_steps.length > 0) {
            formatted += `## Next Steps\n`;
            for (const step of notes.next_steps) {
                formatted += `- ${step}\n`;
            }
            formatted += '\n';
        }

        if (notes.deadlines && notes.deadlines.length > 0) {
            formatted += `## Deadlines\n`;
            for (const deadline of notes.deadlines) {
                formatted += `- ${deadline}\n`;
            }
            formatted += '\n';
        }

        if (notes.dates_times && notes.dates_times.length > 0) {
            formatted += `## Dates & Times Mentioned\n`;
            for (const dt of notes.dates_times) {
                formatted += `- ${dt}\n`;
            }
            formatted += '\n';
        }

        if (notes.people_mentioned && notes.people_mentioned.length > 0) {
            formatted += `## People Mentioned\n`;
            for (const person of notes.people_mentioned) {
                formatted += `- ${person}\n`;
            }
            formatted += '\n';
        }

        if (notes.topics && notes.topics.length > 0) {
            formatted += `## Main Topics\n`;
            for (const topic of notes.topics) {
                formatted += `- ${topic}\n`;
            }
            formatted += '\n';
        }

        return formatted;
    }
}

// Export for use in other modules
window.NoteExtractor = NoteExtractor;