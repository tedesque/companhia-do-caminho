# Companhia do Caminho — Foundry VTT

Versão do pacote: **0.1.0 — protótipo**. Base de regras: **croqui 0.3**.
Alvo de compatibilidade: **Foundry VTT 14 Stable, Build 360**.

O pacote é um sistema de jogo próprio. É selecionado ao criar um mundo; não aparece na lista de módulos adicionais de um mundo que usa outro sistema.

## Instalação manual

1. Encerre o servidor/aplicativo Foundry.
2. Abra a pasta de dados de usuário configurada no seu Foundry. Localize a subpasta `Data/systems`.
3. Extraia deste ZIP a pasta **companhia-do-caminho** para dentro de `Data/systems`.
4. Confira que o arquivo está em **Data/systems/companhia-do-caminho/system.json**. Não deixe duas pastas com o mesmo nome uma dentro da outra.
5. Inicie novamente o Foundry. Em **Game Worlds / Mundos**, crie um mundo e selecione **Companhia do Caminho** como sistema.
6. Entre como narradora/GM. Na primeira abertura, aceite criar o comerciante de exemplo. Você também pode criar um personagem normalmente na aba de Atores/Personagens.

A instalação pelo manifesto ficará disponível após publicar uma release pública com os arquivos system.json e companhia-do-caminho.zip. Não cole um link sandbox no instalador do Foundry.

## Primeiro personagem

Na primeira abertura do mundo, o diálogo oferece criar o comerciante. Para criar mais cópias, use o botão **Criar cópia do comerciante de exemplo**, no fim de qualquer ficha, visível ao GM. Outra opção é criar uma macro do tipo Script:

```js
await game.caminho.createExample();
```

O arquivo `examples/comerciante.json` também está incluído. O botão/macros fazem a importação usando o esquema do sistema; não é preciso editar esse JSON.

O comerciante tem Corpo 5, Ânimo 6, Engenho 4; Resistência 28/28, Esperança 12/12, Carga 5 e Fadiga 0, correspondendo ao encerramento de “Uma manta antes da noite”.

Sua lista de perícias soma 14. Há **2 pontos reservados**, que foram chamados de Subterfúgio na conversa, ainda sem correspondência na lista 0.3. Eles não foram convertidos em Furtividade silenciosamente. Escolha a aplicação com o jogador e reduza o campo de reserva ao distribuí-los. O nome, os dois traços e o costume para o benefício de origem ainda podem ser preenchidos.

## Usar a ficha

Os campos são salvos ao mudar seu valor e sair deles. Clique no nome de uma perícia para abrir um teste. A ficha calcula alvos, máximos de Resistência e Esperança e a condição **Cansado**. Os valores de criação 6/5/4 e a soma de 16 pontos geram lembretes, sem impedir fichas incompletas durante a criação.

- Cada nível de perícia é um d6. Nível zero rola apenas o dado de façanha.
- O alvo usa o atributo correspondente, sem somá-lo aos dados. Provisões, por exemplo, usa Engenho.
- A opção **Esperança** acrescenta 1d6 e desconta um ponto ao concluir a rolagem.
- **Especialidade** permite rolar dois dados de façanha e escolher um. Exige a perícia da função, nível mínimo 1 e disponibilidade na sessão.
- **Origem** acrescenta 1d6 nas duas perícias previstas no perfil. É preciso descrever a experiência pertinente e combiná-la com a narradora. O sistema verifica perícia e disponibilidade; a pertinência narrativa é decidida na mesa.
- **Apoio** permite escolher um único outro ator que você controla, com Esperança e uma perícia pertinente de nível 1 ou maior. Selecione a perícia e descreva como ele ajuda. O custo é aplicado ao ajudante. Para personagens de donos diferentes, a narradora pode executar o teste tendo permissão sobre ambos; não há envio de pedidos automáticos entre jogadores nesta versão.
- A circunstância permite alvo normal, −2 ou +2. Não represente o mesmo obstáculo em duas penalidades.
- A rolagem pode ser pública, privada para a narradora, cega ou somente para você.

Os usos são declarados antes dos resultados. Cancelar o primeiro diálogo não gasta recursos. Se você fechar a escolha entre dois dados depois de rolá-los, o melhor resultado será conservado e a especialidade será usada; isso impede descartar uma rolagem já vista.

O teste usa dados padrão do Foundry, sem exigir módulo de dados: d12 = **1–10 numéricos, 11 Olho (zero), 12 Êxito/Gandalf (sucesso automático)**. A carta do chat mostra a interpretação da regra. A soma bruta do Roll padrão, acessível por ferramentas externas, não representa necessariamente o total ajustado: use a carta do sistema para o resultado. Um seis melhora apenas testes que passaram. As faces visuais são números comuns, sem arte personalizada ou integração específica com Dice So Nice.

Consequências como perder Resistência, aumentar Fadiga ou gastar comida são aplicadas pela mesa nos campos apropriados, após a narradora resolver a situação. Não há punições automáticas de falha.

## Descanso e renovação dos benefícios

- **Noite abrigada:** +4 Resistência e −1 Fadiga, respeitando limites; não recupera Esperança.
- **Noite precária:** +2 Resistência, mantendo Fadiga e Esperança.
- **Intervalo comunitário:** restaura Resistência e Esperança aos máximos e zera Fadiga.
- **Nova sessão:** renova apenas o uso da especialidade deste ator.
- **Nova aventura:** renova apenas o uso do benefício cultural deste ator.

Os botões pedem confirmação. Aplique descanso apenas uma vez para cada período transcorrido. A automação não decide quanto tempo passou. Ferido não é curado por esses botões. Abalado é um registro narrativo sem penalidade.

## Escopo e limites

Inclui ficha em português, 18 perícias, 3 origens, 6 funções, recursos, rolagens, apoio, descanso, estados de uso dos benefícios e personagem de exemplo. Equipamento é descrito em texto e a Carga é informada manualmente. Não inclui combate, progressão, lojas, inventário com itens individuais, compêndio da aventura, conteúdo integral de livros ou as regras específicas de Strider Mode.

Este pacote é uma implementação doméstica do croqui Companhia do Caminho. Não é um produto oficial de The One Ring ou Foundry VTT. O livro comercial não é incluído.

## Validação e compatibilidade

A lógica de regras e as integrações foram verificadas por testes Node.js. Os testes de integração usam substitutos controlados da API, não uma instalação real do Foundry. Sem acesso ao seu servidor nem a uma distribuição licenciada do Build 360 neste ambiente, **a instalação, a renderização real da ficha e o funcionamento ponta a ponta no Build 360 continuam pendentes**.

O manifesto declara a versão 14 como alvo e não declara compatibilidade “verified”, para não apresentar como validado no aplicativo algo que ainda precisa ser confirmado. É possível aparecer um aviso de compatibilidade não verificada. A documentação pública da API consultada é da linha 14; diferenças entre builds podem precisar de um pequeno ajuste.

Ao atualizar, mantenha uma cópia do mundo e substitua a pasta do sistema com o Foundry encerrado. Esta é a primeira versão; não há migração de fichas de outro sistema.

Não execute testes simultâneos do mesmo personagem em dois navegadores: o bloqueio de duplicação é local à janela. Em caso de erro de conexão durante a gravação de um teste, confira o chat e os recursos antes de repetir. A gravação de dois atores não é uma transação de servidor; o código tenta restaurar o ajudante se o gasto do protagonista falhar.

## Roteiro de conferência no Build 360

1. Crie o mundo e o comerciante. Abra a ficha, altere o nome, feche e reabra: o nome deve permanecer.
2. Confira os alvos: Viagem 15, Persuasão 14 e Provisões 16. Confira Resistência 28, Esperança 12 e a reserva de 2 pontos.
3. Role Persuasão com Esperança e especialidade. Devem aparecer 2d12 e 4d6, com escolha de um d12; Esperança cai para 11 e a especialidade fica marcada.
4. Reabra o teste de Persuasão: especialidade deve estar indisponível. **Nova sessão** libera a especialidade e mantém Esperança 11.
5. Teste Cortesia com origem e experiência pertinente. Deve ganhar 1d6 e marcar o benefício sem gastar Esperança. **Nova sessão** não renova a origem; **Nova aventura** renova.
6. Informe Resistência 7, Carga 5 e Fadiga 2. A ficha deve mostrar Cansado e os d6 1–3 devem valer zero nos testes.
7. Informe Resistência 26 e Fadiga 1; aplique noite abrigada: Resistência 28, Fadiga 0, Esperança inalterada.
8. Para testar apoio, crie outro personagem, dê uma perícia ao menos nível 1 e confira o gasto de Esperança do ajudante.
9. Entre com um jogador sem posse do personagem: ele não deve conseguir editar ou gastar seus recursos. Atribua posse e confirme que a ficha fica utilizável.
10. Experimente rolagens privadas com GM e jogador conectados. Confira quem vê os resultados antes de usar segredos numa sessão.

Se algo falhar, informe a ação, a versão exata e a mensagem vermelha. O console do navegador (F12, aba Console, em um navegador de desktop) pode mostrar o detalhe técnico útil para corrigir.

## Testes para desenvolvimento

Com Node.js 22 ou superior, na pasta do sistema:

```sh
node --test tests/*.test.mjs
```

Arquivos de referência consultados:
- https://foundryvtt.com/article/system-development/
- https://foundryvtt.com/api/v14/classes/foundry.abstract.TypeDataModel.html
- https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActorSheetV2.html
- https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html
- https://foundryvtt.com/api/v14/classes/foundry.documents.collections.Actors.html


## Publicar no GitHub e instalar pelo manifesto

Este repositório já inclui um fluxo de releases. Primeiro publique os arquivos em um repositório GitHub público, com Actions habilitado. Não inclui PDF do livro ou outros anexos pessoais.

1. Confirme a versão em `system.json` (inicialmente 0.1.0).
2. Envie uma tag com a mesma versão, por exemplo `v0.1.0`.
3. O workflow executa os testes, monta o pacote e cria uma release com dois assets: `system.json` e `companhia-do-caminho.zip`.
4. No Foundry: **Game Systems → Install System → Manifest URL**. Use o endereço da release mais recente: `https://github.com/tedesque/companhia-do-caminho/releases/latest/download/system.json`, substituindo os dois campos pelo repositório real.
5. Para atualizar, incremente a versão em `system.json`, publique uma nova tag e use a atualização de sistemas no Foundry. Atualizar o código no ramo principal sozinho não publica uma versão.

O endereço de instalação precisa ser acessível sem login; um repositório privado comum não é suficiente para este fluxo. O manifesto aponta sempre para a release mais recente e cada download usa uma versão específica. Não é necessário cadastrar o sistema no catálogo do Foundry para instalar pela URL.

Preparação local sem publicação: `python3 tools/build_release.py --repository tedesque/companhia-do-caminho --tag v0.1.0`. Esses identificadores são exemplos; a URL real só existe após a publicação. A execução desse comando apenas gera arquivos em `dist/`.
