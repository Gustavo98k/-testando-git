import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import * as SQLite from 'expo-sqlite';

export default function App() {
  const [bancoDados, setBancoDados] = useState(null);
  
  // Estados para o formulário de cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');

  // Estados para busca e listagem de usuários
  const [idBusca, setIdBusca] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);

  // 1. INICIALIZAÇÃO DO BANCO E CRIAÇÃO DA TABELA
  useEffect(() => {
    async function configurarBanco() {
      try {
        const conexao = await SQLite.openDatabaseAsync('meubanco_v2.db');
        setBancoDados(conexao);

        // Criação da tabela com Nome, Email e Cargo
        await conexao.execAsync(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            cargo TEXT NOT NULL
          );
        `);

        carregarUsuarios(conexao);
      } catch (erro) {
        console.error('Erro ao inicializar o banco:', erro);
      }
    }

    configurarBanco();
  }, []);

  // 2. CONSULTA SEM PARÂMETRO (Busca todos os cadastros)
  const carregarUsuarios = async (conexao) => {
    try {
      const todasLinhas = await conexao.getAllAsync('SELECT * FROM usuarios;');
      setUsuarios(todasLinhas);
    } catch (erro) {
      console.error('Erro ao buscar usuários:', erro);
    }
  };

  // 3. CONSULTA COM PARÂMETROS - INSERÇÃO (CREATE)
  const adicionarUsuario = async () => {
    if (!nome.trim() || !email.trim() || !cargo.trim() || !bancoDados) return;

    try {
      await bancoDados.runAsync(
        'INSERT INTO usuarios (nome, email, cargo) VALUES (?, ?, ?);', 
        [nome, email, cargo]
      );
      
      // Limpa os campos após salvar
      setNome('');
      setEmail('');
      setCargo('');
      
      carregarUsuarios(bancoDados); // Atualiza a lista na tela
    } catch (erro) {
      console.error('Erro ao inserir usuário:', erro);
    }
  };

  // 4. CONSULTA COM PARÂMETRO - BUSCA FILTRADA POR ID (READ)
  const buscarUsuarioPorId = async () => {
    if (!idBusca.trim() || !bancoDados) return;

    try {
      const resultado = await bancoDados.getFirstAsync(
        'SELECT * FROM usuarios WHERE id = ?;', 
        [idBusca]
      );
      setUsuarioEncontrado(resultado || null);
    } catch (erro) {
      console.error('Erro ao buscar usuário por ID:', erro);
    }
  };

  // 5. CONSULTA COM PARÂMETRO - EXCLUSÃO (DELETE)
  const deletarUsuario = async (id) => {
    if (!bancoDados) return;

    try {
      await bancoDados.runAsync('DELETE FROM usuarios WHERE id = ?;', [id]);
      carregarUsuarios(bancoDados);
      if (usuarioEncontrado && usuarioEncontrado.id === id) {
        setUsuarioEncontrado(null);
      }
    } catch (erro) {
      console.error('Erro ao deletar usuário:', erro);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Cabeçalho */}
      <View style={estilos.containerCabecalho}>
        <Text style={estilos.tituloCabecalho}>Gerenciador de Usuários</Text>
        <Text style={estilos.subtituloCabecalho}>SQLite + React Native Expo</Text>
      </View>

      {/* Formulário de Cadastro */}
      <View style={estilos.cartaoFormulario}>
        <Text style={estilos.tituloCartao}>➕ Novo Cadastro</Text>
        
        <TextInput
          style={estilos.campoTexto}
          placeholder="Nome Completo"
          placeholderTextColor="#999"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={estilos.campoTexto}
          placeholder="E-mail"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={estilos.campoTexto}
          placeholder="Cargo / Função (ex: Desenvolvedor)"
          placeholderTextColor="#999"
          value={cargo}
          onChangeText={setCargo}
        />

        <TouchableOpacity style={estilos.botaoPrincipal} onPress={adicionarUsuario}>
          <Text style={estilos.textoBotao}>Cadastrar Usuário</Text>
        </TouchableOpacity>
      </View>

      {/* Formulário de Busca */}
      <View style={estilos.cartaoBusca}>
        <Text style={estilos.tituloCartao}>🔍 Consultar por ID (WHERE)</Text>
        <View style={estilos.linhaBusca}>
          <TextInput
            style={[estilos.campoTexto, { flex: 1, marginBottom: 0 }]}
            placeholder="Digite o ID..."
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={idBusca}
            onChangeText={setIdBusca}
          />
          <TouchableOpacity style={estilos.botaoBusca} onPress={buscarUsuarioPorId}>
            <Text style={estilos.textoBotao}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {usuarioEncontrado ? (
          <View style={estilos.cartaoEncontrado}>
            <Text style={estilos.tituloTextoEncontrado}>✅ Registro Encontrado:</Text>
            <Text style={estilos.textoEncontrado}>
              <Text style={{ fontWeight: 'bold' }}>#{usuarioEncontrado.id}</Text> - {usuarioEncontrado.nome} ({usuarioEncontrado.cargo})
            </Text>
            <Text style={estilos.emailEncontrado}>{usuarioEncontrado.email}</Text>
          </View>
        ) : idBusca.length > 0 ? (
          <Text style={estilos.textoNaoEncontrado}>Nenhum registro encontrado.</Text>
        ) : null}
      </View>

      <Text style={estilos.tituloSecao}>📋 Usuários Cadastrados ({usuarios.length})</Text>

      {/* Lista de Usuários */}
      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={estilos.cartaoUsuario}>
            <View style={estilos.informacaoUsuario}>
              <View style={estilos.linhaNome}>
                <Text style={estilos.emblemaId}>#{item.id}</Text>
                <Text style={estilos.nomeUsuario}>{item.nome}</Text>
              </View>
              <Text style={estilos.emailUsuario}>✉️ {item.email}</Text>
              <View style={estilos.etiquetaCargo}>
                <Text style={estilos.textoEtiquetaCargo}>💼 {item.cargo}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={estilos.botaoExcluir} 
              onPress={() => deletarUsuario(item.id)}
            >
              <Text style={estilos.textoBotaoExcluir}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={estilos.containerVazio}>
            <Text style={estilos.textoVazio}>Nenhum usuário cadastrado no banco de dados.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ESTILIZAÇÃO COMPLETA EM PORTUGUÊS BRASILEIRO
const estilos = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 16, 
    paddingTop: 40 
  },
  containerCabecalho: { 
    marginBottom: 16, 
    alignItems: 'center' 
  },
  tituloCabecalho: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1F2937' 
  },
  subtituloCabecalho: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginTop: 2 
  },
  cartaoFormulario: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3 
  },
  cartaoBusca: { 
    backgroundColor: '#EEF2FF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  tituloCartao: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 12 
  },
  campoTexto: { 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 10 
  },
  botaoPrincipal: { 
    backgroundColor: '#4F46E5', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 4 
  },
  botaoBusca: { 
    backgroundColor: '#10B981', 
    paddingHorizontal: 18, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 8 
  },
  textoBotao: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 15 
  },
  linhaBusca: { 
    flexDirection: 'row' 
  },
  cartaoEncontrado: { 
    backgroundColor: '#D1FAE5', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#6EE7B7'
  },
  tituloTextoEncontrado: { 
    fontWeight: '700', 
    color: '#065F46', 
    fontSize: 13 
  },
  textoEncontrado: { 
    color: '#047857', 
    fontSize: 14, 
    marginTop: 2 
  },
  emailEncontrado: { 
    color: '#059669', 
    fontSize: 13, 
    marginTop: 1 
  },
  textoNaoEncontrado: { 
    color: '#EF4444', 
    fontSize: 13, 
    marginTop: 8, 
    fontWeight: '500' 
  },
  tituloSecao: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 10 
  },
  cartaoUsuario: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2 
  },
  informacaoUsuario: { 
    flex: 1, 
    paddingRight: 10 
  },
  linhaNome: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  emblemaId: { 
    backgroundColor: '#E0E7FF', 
    color: '#4338CA', 
    fontWeight: '800', 
    fontSize: 12, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4, 
    marginRight: 8 
  },
  nomeUsuario: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827' 
  },
  emailUsuario: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginBottom: 6 
  },
  etiquetaCargo: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 12 
  },
  textoEtiquetaCargo: { 
    fontSize: 12, 
    color: '#4B5563', 
    fontWeight: '600' 
  },
  botaoExcluir: { 
    backgroundColor: '#FEE2E2', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 6 
  },
  textoBotaoExcluir: { 
    color: '#DC2626', 
    fontWeight: '700', 
    fontSize: 13 
  },
  containerVazio: { 
    padding: 30, 
    alignItems: 'center' 
  },
  textoVazio: { 
    color: '#9CA3AF', 
    fontSize: 14, 
    textAlign: 'center' 
  }
});