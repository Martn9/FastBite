# Variables
PYTHON = python3
PIP = pip3

.PHONY: install format lint test run migrations migrate

install:
	$(PIP) install -r requirements.txt

format:
	black catalogo/ pedidos/ usuarios/ core/ manage.py

lint:
	flake8 catalogo/ pedidos/ usuarios/ core/ manage.py --exclude=migrations,__pycache__,venv --max-line-length=88

test:
	pytest --cov=. --cov-report=xml --cov-report=term-missing

run:
	$(PYTHON) manage.py runserver

migrations:
	$(PYTHON) manage.py makemigrations

migrate:
	$(PYTHON) manage.py migrate