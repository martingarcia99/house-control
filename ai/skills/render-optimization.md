# Render Optimization

## Objetivo

Reducir re-renderizados en React.

## Reglas

- Usar React.memo para componentes pesados
- Usar useMemo para cálculos costosos
- Usar useCallback para funciones estables
- Evitar cambios de estado innecesarios

## Regla clave

Si UI no cambia visualmente → no re-renderizar
