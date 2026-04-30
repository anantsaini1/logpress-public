import { ExerciseData, ExerciseFilter, ExerciseSearchParams } from '../types/exercise';
import exerciseDatabase from '../data/exercises_fully_filled.json';

class ExerciseService {
  private exercises: ExerciseData[] = exerciseDatabase as ExerciseData[];

  // Tüm egzersizleri getir
  getAllExercises(): ExerciseData[] {
    return this.exercises;
  }

  // ID'ye göre egzersiz getir
  getExerciseById(id: string): ExerciseData | undefined {
    return this.exercises.find(exercise => exercise.id === id);
  }

  // Arama ve filtreleme
  searchExercises(params: ExerciseSearchParams = {}): ExerciseData[] {
    let filteredExercises = [...this.exercises];

    // Metin araması
    if (params.query) {
      const query = params.query.toLowerCase().trim();
      filteredExercises = filteredExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        exercise.instructions.toLowerCase().includes(query) ||
        exercise.category.toLowerCase().includes(query) ||
        exercise.target.toLowerCase().includes(query)
      );
    }

    // Filtreler
    if (params.filters) {
      const { category, equipment, muscle_group, target } = params.filters;

      if (category) {
        filteredExercises = filteredExercises.filter(exercise => 
          exercise.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (equipment) {
        filteredExercises = filteredExercises.filter(exercise => 
          exercise.equipment.toLowerCase() === equipment.toLowerCase()
        );
      }

      if (muscle_group) {
        filteredExercises = filteredExercises.filter(exercise => 
          exercise.muscle_group.toLowerCase() === muscle_group.toLowerCase()
        );
      }

      if (target) {
        filteredExercises = filteredExercises.filter(exercise => 
          exercise.target.toLowerCase() === target.toLowerCase()
        );
      }
    }

    // Sıralama
    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'asc';
      filteredExercises.sort((a, b) => {
        const aValue = a[params.sortBy!].toLowerCase();
        const bValue = b[params.sortBy!].toLowerCase();
        
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filteredExercises;
  }

  // Kategoriye göre egzersizleri getir
  getExercisesByCategory(category: string): ExerciseData[] {
    return this.exercises.filter(exercise => 
      exercise.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Ekipmana göre egzersizleri getir
  getExercisesByEquipment(equipment: string): ExerciseData[] {
    return this.exercises.filter(exercise => 
      exercise.equipment.toLowerCase() === equipment.toLowerCase()
    );
  }

  // Hedef kasa göre egzersizleri getir
  getExercisesByTarget(target: string): ExerciseData[] {
    return this.exercises.filter(exercise => 
      exercise.target.toLowerCase() === target.toLowerCase()
    );
  }

  // Rastgele egzersiz getir
  getRandomExercises(count: number = 10): ExerciseData[] {
    const shuffled = [...this.exercises].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Tüm benzersiz kategorileri getir
  getCategories(): string[] {
    const categories = [...new Set(this.exercises.map(ex => ex.category))];
    return categories.filter(cat => cat && cat.trim() !== '');
  }

  // Tüm benzersiz ekipmanları getir
  getEquipmentTypes(): string[] {
    const equipments = [...new Set(this.exercises.map(ex => ex.equipment))];
    return equipments.filter(eq => eq && eq.trim() !== '');
  }

  // Tüm benzersiz hedef kasları getir
  getTargetMuscles(): string[] {
    const targets = [...new Set(this.exercises.map(ex => ex.target))];
    return targets.filter(target => target && target.trim() !== '');
  }

  // İstatistikler
  getStats() {
    return {
      totalExercises: this.exercises.length,
      categoriesCount: this.getCategories().length,
      equipmentTypesCount: this.getEquipmentTypes().length,
      targetMusclesCount: this.getTargetMuscles().length,
      exercisesWithImages: this.exercises.filter(ex => ex.image).length,
      exercisesWithGifs: this.exercises.filter(ex => ex.gif_url).length,
    };
  }
}

export const exerciseService = new ExerciseService();
export default exerciseService; 