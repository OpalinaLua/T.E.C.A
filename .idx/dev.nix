# Para saber mais sobre como usar o Nix para configurar seu ambiente
# consulte: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Qual canal nixpkgs usar.
  channel = "stable-24.11"; # or "unstable"
  # Uso https://search.nixos.org/packages para encontrar pacotes
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
  ];
  # Define as variáveis de ambiente no espaço de trabalho
  env = {};
  # Isso adiciona um observador de arquivos para iniciar os emuladores do Firebase. Os emuladores só serão iniciados se
  # um arquivo firebase.json for gravado no diretório do usuário
  services.firebase.emulators = {
    detect = true;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };
  idx = {
    # Procure as extensões que você deseja em https://open-vsx.org/ e usar "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Ativar visualizações e personalizar a configuração
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
