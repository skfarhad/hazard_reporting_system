# Configure k8s master node

## Configure Master Node
```
################# CONTROL NODE Deploye ################
#Disable Swap Space

sudo swapoff -a

cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

cat <<EOF | sudo tee /proc/sys/net/ipv4/ip_forward
1
EOF

sudo sysctl --system

cat <<EOF | sudo tee /proc/sys/net/ipv4/ip_forward
1
EOF


#Installing docker:
sudo apt install apt-transport-https ca-certificates curl software-properties-common curl
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
sudo apt update

sudo apt install docker-ce -y
systemctl start docker



cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "graph": "/mnt/docker-data",
  "storage-driver": "overlay",
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF

rm -rf /etc/docker/daemon.json
systemctl enable docker
systemctl daemon-reload
systemctl status docker




#Installing Kubernetes
apt-get update
mkdir -p -m 755 /etc/apt/keyrings

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
chmod 644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
chmod 644 /etc/apt/sources.list.d/kubernetes.list

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.27/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.27/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
kubeadm version
mv /etc/containerd/config.toml /etc/containerd/config.toml.backup
systemctl restart containerd


kubeadm init  ## master node initialization/decl



mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
OR 
export KUBECONFIG=/etc/kubernetes/admin.conf # did this

kubectl get nodes

# install cni
curl https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/calico.yaml -O
kubectl apply -f calico.yaml

kubeadm token list
kubeadm token create --print-join-command

tail -f /var/log/syslog

kubectl get pods
kubectl get pods --namespace kube-system
kubectl get svc -A
ip r s
```

> reference: [1](https://medium.com/@DaalA/step-by-step-guide-on-how-to-set-up-kubernetes-on-a-virtual-machine-b741b02ad100), [2](https://phoenixnap.com/kb/install-kubernetes-on-ubuntu)