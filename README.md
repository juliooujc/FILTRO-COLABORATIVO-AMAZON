* No backend:

Crie o arquivo .env com a seguinte estrutura:
DB_HOST=******
DB_PORT=******
DB_NAME=******
DB_USER=******
DB_PASSWORD=******

No qual as credenciais vão depender da configuração que você
escolheu na hora de subir o backup (ou seja, ela é individual
na a nossa aplicação)


Para instalar as dependênciias
    pip install -r requirements.txt

Para ativar o backend
    uvicorn app.main:app --relaod

* No frontend:
Para instalar as dependências
    npm install

Para subir o frontend
    npm run dev

* Para o banco de dados:
O banco usado é o PostgreSQL e o backup do banco é o arquivo filtro-colaborativo-amazon.sql
Recomendamos usar a ferramenta pgAdmin4 para exportar e gerenciar as informações dispostas 
no backup