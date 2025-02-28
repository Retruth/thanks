require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static('thanks-space')); // 정적 파일 제공

// GitHub API 설정
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// API 라우트 설정
app.get('/api/messages', async (req, res) => {
    try {
        const query = `
            query {
                repository(owner: "Retruth", name: "thanks") {
                    discussions(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
                        nodes {
                            title
                            body
                            createdAt
                            author {
                                login
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch(GITHUB_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const result = await response.json();
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        const messages = result.data.repository.discussions.nodes;
        res.json(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        res.status(500).json({ error: 'Failed to load messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { userName, message } = req.body;
        if (!userName || !message) {
            return res.status(400).json({ error: 'Missing userName or message' });
        }

        const mutation = `
            mutation {
                createDiscussion(input: {
                    repositoryId: "R_kgDOLLQjjA",
                    categoryId: "DIC_kwDOLLQjjM4CXxXX",
                    title: "Thanks from ${userName}",
                    body: ${JSON.stringify(message)}
                }) {
                    discussion {
                        id
                    }
                }
            }
        `;

        const response = await fetch(GITHUB_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation })
        });

        const result = await response.json();
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 