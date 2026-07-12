package com.datashare.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "DataShare API",
                version = "1.0.0",
                description = """
                        API REST de l'application DataShare.

                        Elle permet :
                        - l'inscription et l'authentification des utilisateurs ;
                        - l'envoi de fichiers ;
                        - la consultation de l'historique ;
                        - le téléchargement par lien public ;
                        - la suppression des fichiers.
                        """,
                contact = @Contact(
                        name = "Cédric Roure"
                ),
                license = @License(
                        name = "Projet pédagogique OpenClassrooms"
                )
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = """
                Token JWT obtenu avec POST /api/auth/login.

                Dans Swagger UI, saisissez uniquement le token.
                """
)
public class OpenApiConfig {

    private static final String AUTH_TAG = "Authentification";
    private static final String FILE_TAG = "Gestion des fichiers";
    private static final String DOWNLOAD_TAG = "Téléchargement";

    @Bean
    public OpenApiCustomizer dataShareOpenApiCustomizer() {
        return openApi -> {
            configureTags(openApi);
            configureOperations(openApi);
            configureSchemas(openApi);
        };
    }

    private void configureTags(OpenAPI openApi) {
        openApi.setTags(List.of(
                new Tag()
                        .name(AUTH_TAG)
                        .description("Création de compte et authentification des utilisateurs."),
                new Tag()
                        .name(FILE_TAG)
                        .description(
                                "Envoi, consultation et suppression des fichiers de l'utilisateur authentifié."
                        ),
                new Tag()
                        .name(DOWNLOAD_TAG)
                        .description(
                                "Consultation des métadonnées et téléchargement par lien public."
                        )
        ));
    }

    private void configureOperations(OpenAPI openApi) {
        configureRegister(openApi);
        configureLogin(openApi);
        configureUpload(openApi);
        configureHistory(openApi);
        configureDelete(openApi);
        configureMetadata(openApi);
        configureDownload(openApi);
    }

    private void configureRegister(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/auth/register",
                PathItem.HttpMethod.POST
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(AUTH_TAG));
        operation.setOperationId("registerUser");
        operation.setSummary("Créer un compte utilisateur");
        operation.setDescription("""
                Crée un nouveau compte DataShare.

                L'adresse e-mail doit être valide et ne doit pas déjà être utilisée.
                Le mot de passe doit contenir au moins 8 caractères.
                """);

        describeResponse(operation, "201", "Utilisateur créé avec succès.");
        describeResponse(operation, "400", "Adresse e-mail ou mot de passe invalide.");
        describeResponse(operation, "409", "Un compte utilise déjà cette adresse e-mail.");

        removeResponse(operation, "401");
    }

    private void configureLogin(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/auth/login",
                PathItem.HttpMethod.POST
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(AUTH_TAG));
        operation.setOperationId("loginUser");
        operation.setSummary("Authentifier un utilisateur");
        operation.setDescription("""
                Vérifie les identifiants de l'utilisateur et retourne un token JWT.

                Le token doit ensuite être envoyé dans l'en-tête HTTP :

                Authorization: Bearer <token>
                """);

        describeResponse(operation, "200", "Authentification réussie et token JWT retourné.");
        describeResponse(operation, "400", "Corps de requête invalide.");
        describeResponse(operation, "401", "Adresse e-mail ou mot de passe incorrect.");

        removeResponse(operation, "409");
    }

    private void configureUpload(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/files/upload",
                PathItem.HttpMethod.POST
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(FILE_TAG));
        operation.setOperationId("uploadFile");
        operation.setSummary("Envoyer un fichier");
        operation.setDescription("""
                Enregistre un fichier et génère un lien de téléchargement temporaire.

                L'utilisateur doit être authentifié avec un token JWT.
                La durée de validité doit être comprise entre 1 et 7 jours.
                """);

        addBearerSecurity(operation);

        /*
         * Springdoc détecte parfois FileUploadRequest comme un paramètre query.
         * On retire ce paramètre de la documentation afin de présenter
         * correctement l'upload sous forme multipart/form-data.
         */
        if (operation.getParameters() != null) {
            operation.getParameters().removeIf(
                    parameter -> "request".equals(parameter.getName())
            );

            if (operation.getParameters().isEmpty()) {
                operation.setParameters(null);
            }
        }

        ObjectSchema multipartSchema = new ObjectSchema();

        multipartSchema.addProperty(
                "file",
                new StringSchema()
                        .format("binary")
                        .description("Fichier à envoyer.")
        );

        multipartSchema.addProperty(
                "expirationDays",
                new IntegerSchema()
                        .minimum(BigDecimal.ONE)
                        .maximum(BigDecimal.valueOf(7))
                        .example(3)
                        .description(
                                "Durée de validité du lien de téléchargement, comprise entre 1 et 7 jours."
                        )
        );

        multipartSchema.addRequiredItem("file");
        multipartSchema.addRequiredItem("expirationDays");

        RequestBody requestBody = new RequestBody()
                .required(true)
                .description("Fichier et durée de validité.")
                .content(
                        new Content().addMediaType(
                                "multipart/form-data",
                                new MediaType().schema(multipartSchema)
                        )
                );

        operation.setRequestBody(requestBody);

        describeResponse(operation, "201", "Fichier envoyé avec succès.");
        describeResponse(operation, "400", "Fichier ou durée d'expiration invalide.");
        describeResponse(operation, "401", "Token JWT absent, expiré ou invalide.");
        describeResponse(operation, "409", "Le fichier ne peut pas être enregistré.");
    }

    private void configureHistory(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/files/history",
                PathItem.HttpMethod.GET
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(FILE_TAG));
        operation.setOperationId("getFileHistory");
        operation.setSummary("Consulter l'historique des fichiers");
        operation.setDescription("""
                Retourne les fichiers appartenant à l'utilisateur authentifié.

                La réponse contient notamment le nom du fichier, sa taille,
                son statut, sa date d'envoi et sa date d'expiration.
                """);

        addBearerSecurity(operation);

        describeResponse(operation, "200", "Historique retourné avec succès.");
        describeResponse(operation, "401", "Token JWT absent, expiré ou invalide.");

        removeResponse(operation, "409");
    }

    private void configureDelete(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/files/{uuidFile}",
                PathItem.HttpMethod.DELETE
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(FILE_TAG));
        operation.setOperationId("deleteFile");
        operation.setSummary("Supprimer un fichier");
        operation.setDescription("""
                Supprime un fichier appartenant à l'utilisateur authentifié.

                L'identifiant UUID du fichier est fourni dans le chemin de la requête.
                """);

        addBearerSecurity(operation);

        if (operation.getParameters() != null) {
            operation.getParameters().stream()
                    .filter(parameter -> "uuidFile".equals(parameter.getName()))
                    .findFirst()
                    .ifPresent(parameter -> {
                        parameter.setDescription("Identifiant UUID du fichier à supprimer.");
                        parameter.setExample("a3e7c945-4b56-4be8-a7d3-920797fb6125");
                    });
        }

        describeResponse(operation, "204", "Fichier supprimé avec succès.");
        describeResponse(operation, "401", "Token JWT absent, expiré ou invalide.");
        describeResponse(operation, "403", "Le fichier n'appartient pas à l'utilisateur.");
        describeResponse(operation, "404", "Fichier introuvable.");

        removeResponse(operation, "409");
    }

    private void configureMetadata(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/download/{token}/metadata",
                PathItem.HttpMethod.GET
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(DOWNLOAD_TAG));
        operation.setOperationId("getDownloadMetadata");
        operation.setSummary("Consulter les métadonnées d'un téléchargement");
        operation.setDescription("""
                Retourne les informations d'un fichier à partir de son token public.

                Cette route ne nécessite pas d'authentification.
                Elle permet notamment d'afficher le nom, la taille et la date
                d'expiration avant le téléchargement.
                """);

        configureTokenParameter(operation);

        describeResponse(operation, "200", "Métadonnées retournées avec succès.");
        describeResponse(operation, "404", "Token inconnu ou fichier introuvable.");
        describeResponse(operation, "410", "Lien expiré ou fichier supprimé.");

        removeResponse(operation, "401");
        removeResponse(operation, "409");
    }

    private void configureDownload(OpenAPI openApi) {
        Operation operation = getOperation(
                openApi,
                "/api/download/{token}",
                PathItem.HttpMethod.GET
        );

        if (operation == null) {
            return;
        }

        operation.setTags(List.of(DOWNLOAD_TAG));
        operation.setOperationId("downloadFile");
        operation.setSummary("Télécharger un fichier");
        operation.setDescription("""
                Télécharge le fichier associé à un token public valide.

                Cette route ne nécessite pas d'authentification.
                Le téléchargement est refusé lorsque le lien est expiré,
                que le fichier a été supprimé ou que le token est inconnu.
                """);

        configureTokenParameter(operation);

        describeResponse(operation, "200", "Fichier retourné en téléchargement.");
        describeResponse(operation, "404", "Token inconnu ou fichier introuvable.");
        describeResponse(operation, "410", "Lien expiré ou fichier supprimé.");

        removeResponse(operation, "401");
        removeResponse(operation, "409");
    }

    private void configureTokenParameter(Operation operation) {
        if (operation.getParameters() == null) {
            return;
        }

        operation.getParameters().stream()
                .filter(parameter -> "token".equals(parameter.getName()))
                .findFirst()
                .ifPresent(parameter -> {
                    parameter.setDescription(
                            "Token public unique présent dans le lien de téléchargement."
                    );
                    parameter.setExample(
                            "9c792ec1-320d-476b-a5c1-e97606082878"
                    );
                });
    }

    private void configureSchemas(OpenAPI openApi) {
        Components components = openApi.getComponents();

        if (components == null || components.getSchemas() == null) {
            return;
        }

        Map<String, Schema> schemas = components.getSchemas();

        describeSchema(
                schemas,
                "RegisterRequest",
                "Informations nécessaires à la création d'un compte."
        );
        describeProperty(
                schemas,
                "RegisterRequest",
                "email",
                "Adresse e-mail valide et unique de l'utilisateur.",
                "cedric@example.com"
        );
        describeProperty(
                schemas,
                "RegisterRequest",
                "password",
                "Mot de passe contenant au moins 8 caractères.",
                "MotDePasse123!"
        );
        setWriteOnly(schemas, "RegisterRequest", "password");

        describeSchema(
                schemas,
                "AuthResponse",
                "Informations du compte utilisateur créé."
        );
        describeProperty(
                schemas,
                "AuthResponse",
                "uuidUser",
                "Identifiant UUID unique de l'utilisateur.",
                "fa42e6b7-2492-4aad-b79e-d3e54dc212e0"
        );
        describeProperty(
                schemas,
                "AuthResponse",
                "email",
                "Adresse e-mail du compte créé.",
                "cedric@example.com"
        );

        describeSchema(
                schemas,
                "LoginRequest",
                "Identifiants utilisés pour l'authentification."
        );
        describeProperty(
                schemas,
                "LoginRequest",
                "email",
                "Adresse e-mail de l'utilisateur.",
                "cedric@example.com"
        );
        describeProperty(
                schemas,
                "LoginRequest",
                "password",
                "Mot de passe de l'utilisateur.",
                "MotDePasse123!"
        );
        setWriteOnly(schemas, "LoginRequest", "password");

        describeSchema(
                schemas,
                "LoginResponse",
                "Token JWT retourné après une authentification réussie."
        );
        describeProperty(
                schemas,
                "LoginResponse",
                "token",
                "Token JWT à transmettre aux routes protégées.",
                "eyJhbGciOiJIUzI1NiJ9..."
        );
        describeProperty(
                schemas,
                "LoginResponse",
                "tokenType",
                "Type du token retourné.",
                "Bearer"
        );

        describeSchema(
                schemas,
                "FileUploadRequest",
                "Paramètres associés à l'envoi d'un fichier."
        );
        describeProperty(
                schemas,
                "FileUploadRequest",
                "expirationDays",
                "Durée de validité du lien, comprise entre 1 et 7 jours.",
                3
        );

        describeSchema(
                schemas,
                "FileUploadResponse",
                "Informations retournées après l'envoi d'un fichier."
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "uuidFile",
                "Identifiant UUID du fichier.",
                "a3e7c945-4b56-4be8-a7d3-920797fb6125"
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "originalFilename",
                "Nom d'origine du fichier.",
                "rapport.pdf"
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "size",
                "Taille du fichier en octets.",
                1048576
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "contentType",
                "Type MIME du fichier.",
                "application/pdf"
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "downloadToken",
                "Token public permettant le téléchargement.",
                "9c792ec1-320d-476b-a5c1-e97606082878"
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "downloadUrl",
                "URL publique de téléchargement.",
                "http://localhost:4200/download/9c792ec1-320d-476b-a5c1-e97606082878"
        );
        describeProperty(
                schemas,
                "FileUploadResponse",
                "expiresAt",
                "Date et heure d'expiration du lien.",
                "2026-07-15T15:00:00Z"
        );

        describeSchema(
                schemas,
                "FileHistoryResponse",
                "Informations d'un fichier présent dans l'historique."
        );
        describeProperty(
                schemas,
                "FileHistoryResponse",
                "status",
                "Statut du fichier : ACTIVE, EXPIRED ou DELETED.",
                "ACTIVE"
        );
        describeProperty(
                schemas,
                "FileHistoryResponse",
                "uploadedAt",
                "Date et heure d'envoi du fichier.",
                "2026-07-12T15:00:00Z"
        );
        describeProperty(
                schemas,
                "FileHistoryResponse",
                "expiresAt",
                "Date et heure d'expiration du fichier.",
                "2026-07-15T15:00:00Z"
        );

        describeSchema(
                schemas,
                "FileDownloadMetadataResponse",
                "Informations publiques disponibles avant le téléchargement."
        );
        describeProperty(
                schemas,
                "FileDownloadMetadataResponse",
                "originalFilename",
                "Nom d'origine du fichier.",
                "rapport.pdf"
        );
        describeProperty(
                schemas,
                "FileDownloadMetadataResponse",
                "size",
                "Taille du fichier en octets.",
                1048576
        );
        describeProperty(
                schemas,
                "FileDownloadMetadataResponse",
                "contentType",
                "Type MIME du fichier.",
                "application/pdf"
        );
        describeProperty(
                schemas,
                "FileDownloadMetadataResponse",
                "expiresAt",
                "Date et heure d'expiration du lien.",
                "2026-07-15T15:00:00Z"
        );

        describeSchema(
                schemas,
                "ApiErrorResponse",
                "Format commun retourné lorsqu'une erreur survient."
        );
        describeProperty(
                schemas,
                "ApiErrorResponse",
                "status",
                "Code HTTP de l'erreur.",
                404
        );
        describeProperty(
                schemas,
                "ApiErrorResponse",
                "error",
                "Libellé associé au code HTTP.",
                "Not Found"
        );
        describeProperty(
                schemas,
                "ApiErrorResponse",
                "message",
                "Description fonctionnelle de l'erreur.",
                "Fichier introuvable"
        );
        describeProperty(
                schemas,
                "ApiErrorResponse",
                "path",
                "Chemin de la requête ayant provoqué l'erreur.",
                "/api/download/token-invalide"
        );
    }

    private Operation getOperation(
            OpenAPI openApi,
            String path,
            PathItem.HttpMethod method
    ) {
        if (openApi.getPaths() == null || openApi.getPaths().get(path) == null) {
            return null;
        }

        return openApi.getPaths().get(path).readOperationsMap().get(method);
    }

    private void addBearerSecurity(Operation operation) {
        operation.setSecurity(
                List.of(
                        new SecurityRequirement().addList("bearerAuth")
                )
        );
    }

    private void describeResponse(
            Operation operation,
            String responseCode,
            String description
    ) {
        if (operation.getResponses() == null) {
            return;
        }

        ApiResponse response = operation.getResponses().get(responseCode);

        if (response == null) {
            response = new ApiResponse();
            operation.getResponses().addApiResponse(responseCode, response);
        }

        response.setDescription(description);
    }

    private void removeResponse(Operation operation, String responseCode) {
        if (operation.getResponses() != null) {
            operation.getResponses().remove(responseCode);
        }
    }

    private void describeSchema(
            Map<String, Schema> schemas,
            String schemaName,
            String description
    ) {
        Schema schema = schemas.get(schemaName);

        if (schema != null) {
            schema.setDescription(description);
        }
    }

    private void describeProperty(
            Map<String, Schema> schemas,
            String schemaName,
            String propertyName,
            String description,
            Object example
    ) {
        Schema schema = schemas.get(schemaName);

        if (schema == null || schema.getProperties() == null) {
            return;
        }

        Schema property = (Schema) schema.getProperties().get(propertyName);

        if (property != null) {
            property.setDescription(description);
            property.setExample(example);
        }
    }

    private void setWriteOnly(
            Map<String, Schema> schemas,
            String schemaName,
            String propertyName
    ) {
        Schema schema = schemas.get(schemaName);

        if (schema == null || schema.getProperties() == null) {
            return;
        }

        Schema property = (Schema) schema.getProperties().get(propertyName);

        if (property != null) {
            property.setWriteOnly(true);
        }
    }
}
