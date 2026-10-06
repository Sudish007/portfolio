// Structured public profile for the JD fit check (/api/fit).
// This is the ONLY source of facts the model may use about Sudish; keep it in step with index.html.
// Availability (roles / location / notice) is merged in at request time from the live config.
export const PROFILE = {
  name: 'Sudish Kumar',
  headline: 'Machine Learning Engineer / AI Benchmarking Specialist at Amazon, Hyderabad, India',
  summary: 'Builds AI systems that ship to production. About 10 years of professional experience, 3+ of them in AI/ML at Amazon and AWS. Two AWS certifications. Also ships consumer Android apps and web products end to end as side projects.',
  numbers: ['10+ AI initiatives delivered', '99%+ data accuracy maintained', 'Tools used daily by a 200+ person team, saving ~45 min per person per day (15-20% productivity gain)', '500+ students taught Python and SQL', '12+ projects shipped'],
  experience: [
    {
      company: 'Amazon', role: 'AI Benchmarking Specialist', period: 'Mar 2026 - present', location: 'Hyderabad',
      highlights: [
        'Building and deploying an agentic AI assistant for Amazon sellers: conversational system over Seller Central data (inventory, orders, revenue, shipping) with natural-language insights and inline visualisations',
        'Designed the full RAG pipeline: SP-API ingestion, ETL, PostgreSQL (structured) + ChromaDB (vectors), LangGraph agent with SQL and retrieval tools, Claude/GPT response generation',
        'Safety and guardrails layer: query classification, harmful-content detection, policy-bypass prevention, hallucination reduction; 99% response accuracy',
        'Leads RLHF evaluation workflows across 1000+ query-response pairs (helpfulness, factual accuracy, data correctness)',
        'Benchmarks AI models end to end: test plans, evaluation metrics and acceptance criteria for accuracy, robustness, bias and reliability'
      ]
    },
    {
      company: 'Amazon Web Services (AWS)', role: 'Machine Learning Data Associate II', period: 'Oct 2024 - Mar 2026', location: 'Bengaluru',
      highlights: [
        'Automated data pipelines in Python (Pandas, NumPy) and SQL to prepare, validate and annotate large datasets across text, code and computer vision, at 99%+ accuracy',
        'High-precision training datasets for agentic AI models in finance, mortgage, health and legal domains; 10+ initiatives including red-teaming, mathematical evaluation and multi-turn conversations',
        'Built "SageMaker Smart Stats" from scratch, a JavaScript productivity-analytics tool adopted by a 200-person team (~45 min saved per associate per day)',
        'Authored technical SOPs and annotation guidelines; cut guideline-related errors by 15%',
        'Tableau and Python dashboards for data-quality monitoring: annotation drift, inter-annotator agreement, SLA adherence'
      ]
    },
    {
      company: 'Amazon', role: 'Artificial Intelligence Associate', period: 'Sep 2023 - Mar 2024', location: 'Delhi (remote)',
      highlights: [
        'Python automation for data validation and quality scoring; model training accuracy improved from 94% to 99%, manual rework down 30%',
        'Performance-monitoring dashboards in Python (Pandas, Matplotlib) and Excel VBA',
        '99.5% dataset accuracy with zero SLA misses; statistical detection of systematic labelling errors with corrective feedback loops'
      ]
    },
    {
      company: 'StudyCzar', role: 'Educator (Physics, Mathematics, Python, SQL)', period: 'Sep 2016 - Aug 2023', location: 'Delhi',
      highlights: ['Taught 500+ students; average scores above 91%; strong written and verbal explanation skills (SOPs, documentation, cross-team communication)']
    }
  ],
  skills: {
    'Machine learning & deep learning': ['PyTorch', 'TensorFlow', 'scikit-learn', 'XGBoost', 'LightGBM', 'random forests', 'CNNs/RNNs', 'feature engineering', 'hyperparameter tuning', 'model optimisation', 'transfer learning'],
    'Generative AI & agentic systems': ['LLM fine-tuning (LoRA/QLoRA)', 'RAG pipelines', 'LangChain', 'LangGraph', 'CrewAI', 'Hugging Face', 'prompt engineering', 'agentic AI', 'MCP (Model Context Protocol)', 'guardrails', 'AI safety', 'red-teaming', 'LLM evaluation', 'vector databases (FAISS, Pinecone, ChromaDB)'],
    'AWS & MLOps': ['SageMaker', 'Bedrock', 'Lambda', 'EC2', 'S3', 'Step Functions', 'Docker', 'Kubernetes', 'MLflow', 'Weights & Biases', 'CI/CD for ML', 'model monitoring', 'A/B testing', 'TorchServe/Triton', 'Prometheus/Grafana'],
    'Python': ['NumPy', 'Pandas', 'FastAPI', 'pytest', 'OOP', 'type hints', 'async', 'data pipelines', 'Matplotlib/Plotly', 'Streamlit/Gradio'],
    'SQL & data engineering': ['PostgreSQL', 'window functions', 'CTEs', 'query optimisation', 'ETL', 'Apache Airflow', 'Apache Spark', 'dbt', 'Kafka', 'data warehousing', 'Snowflake'],
    'Analytics & visualisation': ['Tableau', 'Power BI', 'advanced Excel', 'probability & statistics', 'Jupyter', 'A/B testing'],
    'Tools & infrastructure': ['Git/GitHub', 'Linux', 'REST APIs', 'microservices', 'CI/CD', 'Agile/Scrum', 'Ray Serve'],
    'Web (side)': ['HTML/CSS/JS', 'TypeScript', 'Node.js', 'React Native / Expo', 'Kotlin (Android)', 'Netlify Functions', 'Supabase', 'Razorpay payments']
  },
  projects: [
    'GenAI multimodal chatbot on AWS Bedrock (Claude, streaming, memory, enterprise guardrails; 500+ concurrent users)',
    'RAG document QA on Bedrock with citations (semantic chunking, FAISS, Bedrock embeddings, FastAPI)',
    'End-to-end SageMaker MLOps pipeline for fraud detection (feature engineering, tuning, A/B testing, real-time endpoint; 96.3% precision)',
    'LLM fine-tuning with LoRA/QLoRA in PyTorch for financial QA (4-bit quantisation; +23% accuracy over base)',
    'Sentiment analysis API with fine-tuned DistilBERT (Docker, Lambda, sub-100 ms, 1000+ req/min)',
    'Medical image classification with CNN + ResNet50 transfer learning (94.7% test accuracy, REST API on EC2)',
    'Real-time stock anomaly detector (Z-score / rolling windows, Plotly, tested OOP Python)',
    'E-commerce SQL analytics engine (cohorts, RFM, funnels, forecasting with window functions, EXPLAIN-plan optimisation)',
    'SageMaker Smart Stats internal productivity tool (JavaScript) used daily by a 200-person team',
    'Enterprise fibre-network management system (TypeScript, Node.js, REST)',
    'Live products in production: KaatDo (server-side risk engine for F&O traders, FastAPI/OCI), RishtaPatra (on-device biodata maker, 12 languages), BhojVerse and Telusa (language-learning Android apps), Sri Sai Hospital and Saubhagya Clinic (patient + admin apps with payments)'
  ],
  certifications: ['AWS Certified AI Practitioner (Dec 2025)', 'AWS Generative AI Developer (2026)', 'Google Data Analytics Professional (Apr 2025)', 'Project Management: Agile/Scrum (Jan 2024)', 'Python for Data Science & AI, IBM (2024)', 'SQL for Data Science, UC Davis (2024)'],
  awards: ['Prime Player Award, Feb and Apr 2025 (highest productivity and reliability across the team)', 'Multiple leadership recognitions for agentic-AI SOP development and multilingual dataset creation'],
  notListed: 'Formal education, exact years per individual tool, security clearances, visa status and salary are not part of this profile. Treat JD requirements on those as "not listed, ask Sudish".'
};
