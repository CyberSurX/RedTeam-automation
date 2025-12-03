{{/*
Expand the name of the chart.
*/}}
{{- define "bugbounty-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "bugbounty-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "bugbounty-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "bugbounty-platform.labels" -}}
helm.sh/chart: {{ include "bugbounty-platform.chart" . }}
{{ include "bugbounty-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "bugbounty-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bugbounty-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "bugbounty-platform.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "bugbounty-platform.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the proper image name
*/}}
{{- define "bugbounty-platform.image" -}}
{{- $registryName := .image.repository -}}
{{- $tag := .image.tag | default "latest" -}}
{{- if .image.registry }}
{{- printf "%s/%s:%s" .image.registry $registryName $tag -}}
{{- else -}}
{{- printf "%s:%s" $registryName $tag -}}
{{- end -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names
*/}}
{{- define "bugbounty-platform.imagePullSecrets" -}}
{{- range .image.pullSecrets }}
{{- printf "- name: %s" . }}
{{- end }}
{{- end -}}

{{/*
Create a default fully qualified postgresql name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "bugbounty-platform.postgresql.fullname" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "postgresql" | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s" .Values.postgresql.external.host | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create a default fully qualified redis name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "bugbounty-platform.redis.fullname" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "redis" | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s" .Values.redis.external.host | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create a default fully qualified prometheus name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "bugbounty-platform.prometheus.fullname" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "prometheus" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified grafana name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "bugbounty-platform.grafana.fullname" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "grafana" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the PostgreSQL hostname
*/}}
{{- define "bugbounty-platform.database.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s" (include "bugbounty-platform.postgresql.fullname" .) }}
{{- else }}
{{- printf "%s" .Values.postgresql.external.host }}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL port
*/}}
{{- define "bugbounty-platform.database.port" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "5432" }}
{{- else }}
{{- printf "%s" (.Values.postgresql.external.port | toString) }}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL database name
*/}}
{{- define "bugbounty-platform.database.name" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s" .Values.postgresql.auth.database }}
{{- else }}
{{- printf "%s" .Values.postgresql.external.database }}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL username
*/}}
{{- define "bugbounty-platform.database.user" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s" .Values.postgresql.auth.username }}
{{- else }}
{{- printf "%s" .Values.postgresql.external.username }}
{{- end }}
{{- end }}

{{/*
Return the Redis hostname
*/}}
{{- define "bugbounty-platform.redis.host" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s" (include "bugbounty-platform.redis.fullname" .) }}
{{- else }}
{{- printf "%s" .Values.redis.external.host }}
{{- end }}
{{- end }}

{{/*
Return the Redis port
*/}}
{{- define "bugbounty-platform.redis.port" -}}
{{- if .Values.redis.enabled }}
{{- printf "6379" }}
{{- else }}
{{- printf "%s" (.Values.redis.external.port | toString) }}
{{- end }}
{{- end }}

{{/*
Return the Redis password
*/}}
{{- define "bugbounty-platform.redis.password" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s" .Values.redis.auth.password }}
{{- else }}
{{- printf "%s" .Values.redis.external.password }}
{{- end }}
{{- end }}

{{/*
Return the API Gateway service name
*/}}
{{- define "bugbounty-platform.apiGateway.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "api-gateway" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Frontend service name
*/}}
{{- define "bugbounty-platform.frontend.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "frontend" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Recon Service service name
*/}}
{{- define "bugbounty-platform.reconService.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "recon-service" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Scanning Service service name
*/}}
{{- define "bugbounty-platform.scanningService.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "scanning-service" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Exploitation Service service name
*/}}
{{- define "bugbounty-platform.exploitationService.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "exploitation-service" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Triage Service service name
*/}}
{{- define "bugbounty-platform.triageService.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "triage-service" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Reporting Service service name
*/}}
{{- define "bugbounty-platform.reportingService.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "reporting-service" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Prometheus service name
*/}}
{{- define "bugbounty-platform.prometheus.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "prometheus" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the Grafana service name
*/}}
{{- define "bugbounty-platform.grafana.serviceName" -}}
{{- printf "%s-%s" (include "bugbounty-platform.fullname" .) "grafana" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Check if there are rolling tags in the image
*/}}
{{- define "bugbounty-platform.rollingTags" -}}
{{- if or (contains "latest" .image.tag) (contains "edge" .image.tag) (contains "rolling" .image.tag) }}
{{- printf "true" }}
{{- else }}
{{- printf "false" }}
{{- end }}
{{- end }}

{{/*
Validate values
*/}}
{{- define "bugbounty-platform.validateValues" -}}
{{- if and .Values.ingress.enabled (not .Values.ingress.hosts) }}
{{- fail "ERROR: You must provide ingress hosts when ingress is enabled!" }}
{{- end }}
{{- if and .Values.postgresql.enabled (not .Values.postgresql.auth.password) }}
{{- fail "ERROR: You must provide a PostgreSQL password when using the built-in PostgreSQL!" }}
{{- end }}
{{- if and .Values.redis.enabled (not .Values.redis.auth.password) }}
{{- fail "ERROR: You must provide a Redis password when using the built-in Redis!" }}
{{- end }}
{{- end -}}