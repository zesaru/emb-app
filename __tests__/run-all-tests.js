/**
 * Script para ejecutar todas las pruebas sin Jest
 * Ejecuta todas las suites de pruebas y genera un reporte
 */

const { execSync } = require('child_process');

console.log('🧪 Ejecutando Todas las Pruebas de Login\n');
console.log('='.repeat(50));

const tests = [
  {
    name: 'Pruebas Básicas de Funcionalidad',
    file: 'simple-login-test.js',
    description: 'Validaciones básicas, seguridad, rendimiento'
  },
  {
    name: 'Pruebas de Flujo de Login',
    file: 'login-specific-test.js', 
    description: 'Casos completos de login exitoso/fallido'
  },
  {
    name: 'Pruebas con Mock Environment',
    file: 'mock-login-test.js',
    description: 'Simulación completa del entorno real'
  }
];

let totalPassed = 0;
let totalTests = tests.length;
let results = [];

for (const [index, test] of tests.entries()) {
  console.log(`\n📋 ${index + 1}. ${test.name}`);
  console.log(`   📄 ${test.description}`);
  console.log(`   🏃 Ejecutando: ${test.file}`);
  console.log('-'.repeat(50));
  
  try {
    // Ejecutar la prueba
    const output = execSync(`node __tests__/${test.file}`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    // Verificar si pasó (buscar mensajes de éxito)
    const success = output.includes('✅') && 
                   (output.includes('100%') || output.includes('All') || output.includes('passed'));
    
    if (success) {
      console.log('   ✅ ESTADO: PASÓ');
      totalPassed++;
      results.push({ ...test, status: 'PASÓ', success: true });
    } else {
      console.log('   ❌ ESTADO: FALLÓ');
      results.push({ ...test, status: 'FALLÓ', success: false });
    }
    
  } catch (error) {
    console.log('   ❌ ESTADO: ERROR EN EJECUCIÓN');
    console.log(`   💥 Error: ${error.message}`);
    results.push({ ...test, status: 'ERROR', success: false, error: error.message });
  }
}

// Reporte final
console.log('\n' + '='.repeat(50));
console.log('📊 REPORTE FINAL DE PRUEBAS');
console.log('='.repeat(50));

results.forEach((result, index) => {
  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} ${index + 1}. ${result.name}: ${result.status}`);
  if (result.error) {
    console.log(`   💥 ${result.error}`);
  }
});

console.log('\n📈 ESTADÍSTICAS:');
console.log(`   ✅ Pruebas Pasadas: ${totalPassed}/${totalTests}`);
console.log(`   ❌ Pruebas Fallidas: ${totalTests - totalPassed}/${totalTests}`);
console.log(`   📊 Tasa de Éxito: ${Math.round((totalPassed / totalTests) * 100)}%`);

if (totalPassed === totalTests) {
  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  console.log('🚀 El sistema de login está funcionando correctamente.');
  console.log('✅ Listo para producción.');
} else {
  console.log('\n⚠️  Algunas pruebas fallaron.');
  console.log('🔧 Revisa los errores arriba para más detalles.');
}

console.log('\n🏁 Pruebas completadas.');
console.log(`⏰ Ejecutado el: ${new Date().toLocaleString('es-ES')}`);