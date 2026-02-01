# 📧 Sistema de Classificação Inteligente de Emails

Sistema web para classificação automática de emails corporativos utilizando IA (Groq API + LLaMA 3.1).

---

## 🌐 Acesso Online

### Links da Aplicação Hospedada:

- **Frontend:** https://email-classifier-ai-three.vercel.app
- **Backend API:** https://emailclassifier-ai-618m.onrender.com


---

## ✨ Funcionalidades Adicionais Implementadas

Além dos requisitos base, três funcionalidades extras foram desenvolvidas para melhorar a experiência do usuário:

1. **⏱️ Indicador de Tempo de Análise da IA**
   - Exibe em tempo real quanto tempo a IA levou para classificar cada email
   - Permite ao usuário avaliar a performance do sistema

2. **📊 Histórico de Análises (LocalStorage)**
   - Armazena localmente até 50 análises realizadas
   - Permite revisitar classificações anteriores sem necessidade de reprocessamento
   - Funciona offline após o primeiro carregamento

3. **👍 Sistema de Feedback do Usuário**
   - Interface para o usuário avaliar se a classificação está correta ou incorreta

---

## 🚀 Executar Localmente

### Pré-requisitos:
- Python 3.8+
- Chave de API do Groq

### Passo a Passo:

#### 1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_DIRETORIO]
```

#### 2. **Configure a chave da API**
Crie um arquivo `.env` no diretório `backend/` com:
```
GROQ_API_KEY=sua_chave_aqui
GROQ_MODEL=llama-3.1-8b-instant
```

#### 3. **Alterar a API no app.js**
Dentro do diretório frontend, no arquivo `app.js`, altere a const API_URL para consumir o backend local:
```
const API_URL = 'http://localhost:8000';
```


#### 4. **Instale as dependências**
```bash
cd backend
pip install -r requirements.txt
```

#### 5. **Execute o Backend**
```bash
uvicorn main:app --reload
```
O backend estará disponível em: `http://localhost:8000`

#### 6. **Execute o Frontend** (em outro terminal)
```bash
cd frontend
python -m http.server 10000
```
O frontend estará disponível em: `http://localhost:10000`

---

## 📁 Estrutura do Projeto

```
projeto/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── index.html
    └── app.js
```

---

## 🛠️ Tecnologias Utilizadas

### Backend:
- FastAPI
- Groq API (LLaMA 3.1)
- PyPDF2
- Pydantic

### Frontend:
- HTML/CSS (Tailwind CSS)
- JavaScript Vanilla
- PDF.js

---

## 📝 Uso

1. Acesse a aplicação pelo link do frontend
2. Escolha entre digitar um email ou fazer upload de arquivo (.txt ou .pdf)
3. Clique em "Analisar"
4. Visualize a classificação, análise e resposta sugerida
5. Opcionalmente, forneça feedback sobre a classificação

---

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

---

## 👤 Autor

**Silas Leão**
