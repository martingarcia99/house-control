# CLAUDE.md

## Memoria de codigo (codebase-memory-mcp)

Este proyecto esta indexado con codebase-memory-mcp. El grafo del codigo (archivos, simbolos, dependencias, arquitectura) ya esta cacheado - usalo en lugar de explorar el repo desde cero cada vez, para ahorrar tokens.

Antes de explorar manualmente con Glob/Grep/Read en preguntas sobre estructura, arquitectura o relaciones del codigo, prueba primero con las herramientas MCP:

- search_code / search_graph - buscar simbolos, archivos o nodos relevantes por texto.
- query_graph - consultar el grafo (dependencias, llamadas, referencias).
- trace_path - trazar rutas de dependencia entre dos nodos.
- get_code_snippet - obtener el fragmento de codigo de un nodo ya indexado sin releer el archivo entero.
- get_architecture - vision general de la arquitectura del proyecto.
- get_graph_schema - esquema de tipos de nodos y aristas disponibles.
- index_status / detect_changes - comprobar si el indice esta al dia antes de confiar en el.
- manage_adr - leer y actualizar los Architecture Decision Records persistidos.

Si las herramientas MCP no aparecen disponibles en la sesion, usa el binario directamente:

codebase-memory-mcp cli TOOL --flag value

(usa --help en cada subcomando para ver los flags; evita pasar JSON crudo, esta deprecado).

### Cuando re-indexar

Si ha pasado tiempo desde la ultima sesion o ha habido cambios grandes, ejecuta detect_changes o index_repository de nuevo antes de asumir que el indice sigue siendo valido.
