from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import json
import PyPDF2
import io
import os
from datetime import datetime

# Inicialização do FastAPI
app = FastAPI(
    title="Email Classification API",
    description="API para classificação automática de emails e geração de respostas",
    version="1.0.0"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Modelos de dados
class EmailRequest(BaseModel):
    content: str


class EmailResponse(BaseModel):
    categoria: str
    confianca: str
    resposta_sugerida: str
    analise: str
    timestamp: str


# Configuração do Groq API
# Nota: Em produção, usar variáveis de ambiente
# Para este desafio, a chave será configurada no momento da execução
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY não encontrada no .env")

client = Groq(api_key=GROQ_API_KEY)

def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extrai texto de arquivo PDF
    O Sistema utiliza o PyPDF2, por ser leve e suficiente para PDFs simples como no caso desse sistema.
    """
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)

        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar PDF: {str(e)}")


def classify_and_generate_response(email_content: str) -> dict:
    """
    Classifica o email e gera resposta automática usando o Groq

    O sistema utiliza few-shot learning via prompt, fornecendo exemplos no contexto para orientar a IA sem realizar fine-tuning do modelo.

    Estrutura do prompt:
    - Contexto da função atribuída á IA e ambiente de trabalho (empresa do setor financeiro)
    - Passo a passo bem detalhado do que deve ser feito
    - Instruções claras e estruturadas
    - Formato JSON para parsing confiável
    - Exemplos para melhor precisão
    """

    if not GROQ_API_KEY or GROQ_API_KEY == "":
        raise HTTPException(
            status_code=500,
            detail="Chave do Groq API não configurada. Configure a variável GROQ_API_KEY"
        )


    prompt = f"""Você é um assistente de IA especializado em classificação de emails para uma empresa do setor financeiro.

Sua tarefa é analisar o email abaixo e:
1. Classificar como "Produtivo" ou "Improdutivo"
2. Gerar uma resposta automática apropriada
3. Fornecer uma breve análise da decisão

DEFINIÇÕES:
- Produtivo: Emails que requerem ação específica (solicitações de suporte, atualizações de casos, dúvidas sobre sistemas, documentos importantes)
- Improdutivo: Emails que não necessitam ação imediata (felicitações, agradecimentos genéricos, mensagens sociais) ou Emails aleatórios que não possuam ligação ou contexto com a empresa

EXEMPLOS:
Email:
"Olá, estou com problemas para acessar o sistema desde ontem. Poderiam verificar?"

Resposta:
{{
  "categoria": "Produtivo",
  "confianca": "Alta",
  "resposta_sugerida": "Recebemos sua solicitação e nossa equipe de suporte já está analisando o problema. Em breve retornaremos com uma solução.",
  "analise": "O email relata um problema técnico e solicita suporte, exigindo ação imediata da empresa."
}}

Email:
"Bom dia! Gostaria de agradecer pelo excelente atendimento que recebi esta semana, Abraço!"

Resposta:
{{
  "categoria": "Improdutivo",
  "confianca": "Alta",
  "resposta_sugerida": "Agradecemos muito pelo seu feedback! Ficamos felizes em saber da sua experiência positiva com nosso atendimento.",
  "analise": "O email é apenas um elogio e não requer nenhuma ação específica."
}}

AGORA, ANALISE O EMAIL A SEGUIR:
---
{email_content}
---

Responda APENAS com um JSON válido no seguinte formato:
{{
    "categoria": "Produtivo" ou "Improdutivo",
    "confianca": "Alta", "Média" ou "Baixa",
    "resposta_sugerida": "texto da resposta automática sugerida",
    "analise": "breve explicação da classificação (1-2 frases)"
}}

Diretrizes para respostas:
- Produtivo: Resposta profissional informando que a solicitação foi recebida e será processada
- Improdutivo: Resposta cordial e breve agradecendo o contato
- Use tom profissional mas amigável
- Seja conciso
"""

    # Chamada à API do Groq
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "Você é um especialista em classificação de emails corporativos."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Baixa temperatura = mais consistente e previsível, menor chance de "alucinação"
            max_tokens=500
        )

        # Extração e parsing da resposta
        result_text = response.choices[0].message.content.strip()

        # Remove marcadores de código se presentes
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif result_text.startswith("```"):
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result = json.loads(result_text)

        return result

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar resposta da IA: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro na chamada ao Groq: {str(e)}"
        )


# Endpoints da API
@app.post("/classify-text", response_model=EmailResponse)
async def classify_text(email: EmailRequest):
    """
    Classifica texto de email enviado diretamente
    """
    if not email.content or len(email.content.strip()) < 25:
        raise HTTPException(
            status_code=400,
            detail="O conteúdo do email deve ter pelo menos 25 caracteres"
        )

    result = classify_and_generate_response(email.content)

    return EmailResponse(
        categoria=result["categoria"],
        confianca=result["confianca"],
        resposta_sugerida=result["resposta_sugerida"],
        analise=result["analise"],
        timestamp=datetime.now().isoformat()
    )


@app.post("/classify-file", response_model=EmailResponse)
async def classify_file(file: UploadFile = File(...)):
    """
    Classifica email a partir de arquivo (.txt ou .pdf)
    """
    # Validação do tipo de arquivo
    allowed_extensions = [".txt", ".pdf"]
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de arquivo não suportado. Use: {', '.join(allowed_extensions)}"
        )

    # Leitura do conteúdo
    content = await file.read()

    # Extração do texto baseado no tipo
    if file_extension == ".pdf":
        email_text = extract_text_from_pdf(content)
    else:  # .txt
        try:
            email_text = content.decode("utf-8")
        except UnicodeDecodeError:
            # Fallback para latin-1 se UTF-8 falhar
            email_text = content.decode("latin-1")

    if not email_text or len(email_text.strip()) < 25:
        raise HTTPException(
            status_code=400,
            detail="Não foi possível extrair texto suficiente do arquivo (menos de 25 caracteres encontrados)"
        )

    result = classify_and_generate_response(email_text)

    return EmailResponse(
        categoria=result["categoria"],
        confianca=result["confianca"],
        resposta_sugerida=result["resposta_sugerida"],
        analise=result["analise"],
        timestamp=datetime.now().isoformat()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000)
