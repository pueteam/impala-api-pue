# GKE Setup

## Reference doc

<https://cloud.google.com/kubernetes-engine/docs/how-to/ingress-multi-ssl>

Create the deployment

```bash
kubectl apply -f 00-sgpc-deployment.yaml
```

Create the service as a NodePort

```bash
kubectl apply -f 01-sgpc-service-nodeport.yaml
```

Upload the secrets

```bash
kubectl create secret tls podo-2019-cert \
  --cert podo_2019.crt --key podo_2019.key
```

Create the ingress

```bash
kubectl apply -f 02-gke-ingress.yaml
```

Wait between 10-15 minutes:

```bash
kubectl describe ingress api-beta-ingress
Name:             api-beta-ingress
Namespace:        default
Address:          35.246.240.219
Default backend:  default-http-backend:80 (10.48.0.12:8080)
TLS:
  podo-2019-cert terminates
Rules:
  Host             Path  Backends
  ----             ----  --------
  sgpc.mipodo.com
                      sgpc-60000:sgpc-http (<none>)
Annotations:
  ingress.kubernetes.io/backends:                    {"k8s-be-31192--67d07e9a14a6afa3":"HEALTHY","k8s-be-31739--67d07e9a14a6afa3":"HEALTHY"}
  ingress.kubernetes.io/forwarding-rule:             k8s-fw-default-api-beta-ingress--67d07e9a14a6afa3
  ingress.kubernetes.io/target-proxy:                k8s-tp-default-api-beta-ingress--67d07e9a14a6afa3
  ingress.kubernetes.io/url-map:                     k8s-um-default-api-beta-ingress--67d07e9a14a6afa3
  kubectl.kubernetes.io/last-applied-configuration:  {"apiVersion":"extensions/v1beta1","kind":"Ingress","metadata":{"annotations":{},"name":"api-beta-ingress","namespace":"default"},"spec":{"rules":[{"host":"sgpc.mipodo.com","http":{"paths":[{"backend":{"serviceName":"sgpc-60000","servicePort":"sgpc-http"}}]}}],"tls":[{"secretName":"podo-2019-cert"}]}}

  ingress.kubernetes.io/https-forwarding-rule:  k8s-fws-default-api-beta-ingress--67d07e9a14a6afa3
  ingress.kubernetes.io/https-target-proxy:     k8s-tps-default-api-beta-ingress--67d07e9a14a6afa3
  ingress.kubernetes.io/ssl-cert:               k8s-ssl-82d3bb646d60d21c-45f91195b5da601e--67d07e9a14a6afa3
  ingress.kubernetes.io/static-ip:              k8s-fw-default-api-beta-ingress--67d07e9a14a6afa3
Events:
  Type    Reason  Age                 From                     Message
  ----    ------  ----                ----                     -------
  Normal  CREATE  25m                 ingress-controller       Ingress default/api-beta-ingress
  Normal  ADD     25m                 loadbalancer-controller  default/api-beta-ingress
  Normal  CREATE  58s (x26 over 25m)  loadbalancer-controller  ip: 35.201.71.93
  Normal  UPDATE  4s (x54 over 25m)   ingress-controller       Ingress default/api-beta-ingress
```