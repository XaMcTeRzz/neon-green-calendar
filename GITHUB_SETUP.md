# Інструкції для публікації проекту на GitHub

Цей документ містить покрокові інструкції для публікації Telegram бота на GitHub та його подальшого налаштування.

## Підготовка репозиторію

1. Створіть новий репозиторій на GitHub:
   - Перейдіть на [GitHub](https://github.com) і увійдіть у свій обліковий запис
   - Натисніть на "+" у верхньому правому куті та виберіть "New repository"
   - Введіть ім'я репозиторію, наприклад, "telegram-task-bot"
   - Додайте опис (опціонально)
   - Вибрати публічний або приватний репозиторій
   - Натисніть "Create repository"

2. Створіть файл `.gitignore` для виключення непотрібних файлів:

```
# Віртуальне середовище
venv/
env/
.env/

# Кеш Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Файли конфігурації
config.json
messenger_config.json
token.pickle
token.json
credentials.json

# Інші файли
.DS_Store
.env
.flaskenv
*.swp
.idea/
.vscode/
*.sublime-project
*.sublime-workspace

# Локальна база даних задач
tasks.json
```

3. Ініціалізуйте локальний репозиторій та підготуйте перший коміт:

```bash
# Ініціалізація Git репозиторію
git init

# Додавання всіх файлів до індексу
git add .

# Створення першого коміту
git commit -m "Initial commit: Telegram task bot with Google Calendar integration"

# Підключення до віддаленого репозиторію (замініть URL на ваш)
git remote add origin https://github.com/your-username/telegram-task-bot.git

# Відправка коду на GitHub
git push -u origin main # або git push -u origin master, залежно від назви вашої гілки
```

## Налаштування захищених даних

Для безпечного зберігання токенів та інших конфіденційних даних рекомендуємо використовувати GitHub Secrets:

1. Перейдіть у налаштування вашого репозиторію на GitHub
2. Перейдіть до розділу "Secrets and variables" -> "Actions"
3. Натисніть "New repository secret"
4. Додайте ваші секрети (наприклад, `TELEGRAM_TOKEN`, `GOOGLE_CREDENTIALS` тощо)

## Налаштування GitHub Actions для автоматичного тестування

Створіть файл `.github/workflows/python-test.yml` для автоматичного тестування:

```yaml
name: Python Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
        pip install pytest pytest-cov
    - name: Lint with flake8
      run: |
        pip install flake8
        # stop the build if there are Python syntax errors or undefined names
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
    - name: Test with pytest
      run: |
        pytest
```

## Додавання документації

1. Оновіть README.md з докладним описом проекту
2. Додайте документацію API та інструкції з використання
3. Додайте скріншоти та приклади використання

## Розгортання бота на сервері

Для розгортання бота на сервері, можна використовувати:

1. **Heroku** - безкоштовний хостинг для невеликих проектів
   - Створіть файл `Procfile` з вмістом: `worker: python src/telegram_bot_extended.py`
   - Додайте змінні середовища в налаштуваннях Heroku

2. **GitHub Actions + VPS** - автоматичне розгортання на власному сервері
   - Створіть додатковий GitHub workflow для розгортання
   - Використовуйте SSH для підключення до сервера

3. **PythonAnywhere** або **DigitalOcean** - хостинг для тривалого запуску

## Оновлення коду

Для оновлення коду на GitHub:

```bash
# Додайте змінені файли
git add .

# Створіть коміт з описом змін
git commit -m "Опис внесених змін"

# Відправте зміни на GitHub
git push origin main
```

## Корисні посилання

- [GitHub Documentation](https://docs.github.com/en)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Heroku Deployment](https://devcenter.heroku.com/categories/deployment)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Google Calendar API Documentation](https://developers.google.com/calendar) 