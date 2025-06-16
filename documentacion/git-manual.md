# Clonar el repositorio (primera vez)
git clone https://github.com/tu-usuario/regente.git

# Crear y cambiar a la rama development (primera vez)
git checkout -b development

# Para nuevas funcionalidades
git checkout development
git checkout -b feature/nueva-funcionalidad

# Cuando termines la funcionalidad
git add .
git commit -m "Implementa nueva funcionalidad"
git checkout development
git merge feature/nueva-funcionalidad

# Cuando quieras desplegar a producción
git checkout main
git merge development
git push origin main  # Esto activará los despliegues automáticos
